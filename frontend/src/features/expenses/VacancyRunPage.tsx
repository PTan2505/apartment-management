import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useBuildings } from '@/features/buildings/hooks'
import { monthLabel, recentMonths } from '@/features/invoices/labels'
import { useRecordVacancy, useVacancyDue } from '@/features/expenses/hooks'
import type { VacancyDue } from '@/features/expenses/types'

/**
 * Closing off a month's empty rooms.
 *
 * ── The cost an owner cannot see missing ───────────────────────────────────
 *
 * Rent and utilities announce themselves: a tenant is billed, or is not. A room
 * standing empty runs its meter quietly, nobody is billed, and nothing anywhere
 * asks about it — so it is never recorded, and every revenue report is too
 * flattering by an amount nobody can name afterwards.
 *
 * ── Why it looks exactly like the billing round ────────────────────────────
 *
 * Not for convenience: the two ARE the same task. A per-room round, once a
 * month, where the real risk is silently skipping one. Same month picker, same
 * opening figure beside the field, same per-row submission, same "what remains
 * is what remains to be done", same "the month is finished" instead of an empty
 * table. An owner who has learned one screen has learned this one.
 */

interface RowState {
  reading: string
  status: 'idle' | 'saving' | 'failed'
  error?: string
  note?: string
}

function parseReading(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

export function VacancyRunPage() {
  const months = recentMonths()
  // Last month, not this one: a month's vacancy is only known once it is over.
  const [period, setPeriod] = useState(() => months[1] ?? months[0]!)
  const [buildingId, setBuildingId] = useState<number | ''>('')
  const [rows, setRows] = useState<Record<number, RowState>>({})

  const buildingsQuery = useBuildings({ pageSize: 200 })
  const dueQuery = useVacancyDue(
    period.year,
    period.month,
    buildingId === '' ? undefined : buildingId,
  )
  const record = useRecordVacancy()
  const due = dueQuery.data ?? []

  function setRow(roomId: number, patch: Partial<RowState>) {
    setRows((current) => ({
      ...current,
      [roomId]: { ...(current[roomId] ?? { reading: '', status: 'idle' as const }), ...patch },
    }))
  }

  /**
   * The one check done here: a reading below the one the room opens from.
   *
   * Deliberately NOT a client-side copy of the charge — nothing here multiplies
   * by a rate. It catches a typo against a number already on the screen, which
   * is the commonest mistake and the cheapest place to catch it.
   */
  function localProblem(row: VacancyDue, entry: string): string | null {
    const reading = parseReading(entry)
    if (reading === null) return 'Nhập một số nguyên'
    if (reading < row.previousReading) {
      return `Thấp hơn số đầu kỳ ${row.previousReading}`
    }
    return null
  }

  async function save(row: VacancyDue) {
    const entry = rows[row.roomId]?.reading ?? ''
    const problem = localProblem(row, entry)
    if (problem) {
      setRow(row.roomId, { status: 'failed', error: problem })
      return
    }

    setRow(row.roomId, { status: 'saving', error: undefined })
    try {
      const result = await record.mutateAsync({
        roomId: row.roomId,
        year: period.year,
        month: period.month,
        currentReading: parseReading(entry)!,
      })
      // A meter that has not moved is a real outcome with nothing to charge.
      // The room still leaves the list, so this is only worth a note.
      if (result.expense === null) {
        setRow(row.roomId, { status: 'idle', note: 'Công tơ không đổi — không có gì để tính' })
      }
    } catch (cause) {
      setRow(row.roomId, {
        status: 'failed',
        error: isApiError(cause) ? cause.message : 'Không ghi được số điện này.',
      })
    }
  }

  function rowError(row: VacancyDue): string | undefined {
    const state = rows[row.roomId]
    if (state?.status === 'failed') return state.error
    const entry = state?.reading ?? ''
    if (entry.trim() === '') return undefined
    return localProblem(row, entry) ?? undefined
  }

  /** What this row will cost, once it is valid. Read from the row's own rate. */
  function preview(row: VacancyDue): string | undefined {
    const entry = rows[row.roomId]?.reading ?? ''
    const reading = parseReading(entry)
    if (reading === null || reading < row.previousReading) return undefined
    const units = reading - row.previousReading
    return `${units} kWh · ${formatMoney(units * row.electricityRate)}`
  }

  function body() {
    if (dueQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (dueQuery.error) {
      return (
        <Alert
          severity={isApiError(dueQuery.error) && dueQuery.error.isTransport ? 'warning' : 'error'}
          action={
            <Button color="inherit" size="small" onClick={() => void dueQuery.refetch()}>
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được danh sách còn thiếu</AlertTitle>
          {isApiError(dueQuery.error) ? dueQuery.error.message : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (due.length === 0) {
      return (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <AlertTitle>{monthLabel(period.year, period.month)} đã xong</AlertTitle>
          Mọi phòng trống đều đã được ghi số điện cho tháng đó.
        </Alert>
      )
    }

    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {due.length === 1 ? '1 phòng trống' : `${due.length} phòng trống`} chưa ghi —
          mỗi dòng biến mất khi đã nhập số điện.
        </Typography>

        {/* Desktop */}
        <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Phòng</TableCell>
                <TableCell align="right">Số đầu kỳ</TableCell>
                <TableCell>Số điện cuối kỳ</TableCell>
                <TableCell>Thành tiền</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {due.map((row) => (
                <TableRow key={row.roomId}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {row.roomCode}
                    </Typography>
                    {!buildingId && row.building && (
                      <Typography variant="caption" color="text.secondary">
                        {row.building.displayName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {row.previousReading}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={rows[row.roomId]?.reading ?? ''}
                      onChange={(event) =>
                        setRow(row.roomId, { reading: event.target.value, status: 'idle' })
                      }
                      error={rowError(row) !== undefined}
                      helperText={rowError(row) ?? rows[row.roomId]?.note}
                      slotProps={{ htmlInput: { min: row.previousReading, step: 1 } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {preview(row) ?? ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      disabled={
                        rows[row.roomId]?.status === 'saving' ||
                        localProblem(row, rows[row.roomId]?.reading ?? '') !== null
                      }
                      onClick={() => void save(row)}
                    >
                      {rows[row.roomId]?.status === 'saving' ? 'Đang lưu…' : 'Ghi'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Phone — the owner may be reading meters while standing in the building. */}
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
          {due.map((row) => (
            <Card key={row.roomId} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{row.roomCode}</Typography>
                    {row.building && !buildingId && (
                      <Typography variant="body2" color="text.secondary">
                        {row.building.displayName}
                      </Typography>
                    )}
                  </Box>
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    label="Số điện cuối kỳ"
                    value={rows[row.roomId]?.reading ?? ''}
                    onChange={(event) =>
                      setRow(row.roomId, { reading: event.target.value, status: 'idle' })
                    }
                    error={rowError(row) !== undefined}
                    helperText={
                      rowError(row) ?? preview(row) ?? `Số đầu kỳ ${row.previousReading}`
                    }
                    slotProps={{
                      htmlInput: { min: row.previousReading, step: 1 },
                      inputLabel: { shrink: true },
                    }}
                  />
                  <Button
                    variant="contained"
                    disabled={
                      rows[row.roomId]?.status === 'saving' ||
                      localProblem(row, rows[row.roomId]?.reading ?? '') !== null
                    }
                    onClick={() => void save(row)}
                  >
                    {rows[row.roomId]?.status === 'saving' ? 'Đang lưu…' : 'Ghi số điện'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </>
    )
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Phòng trống trong tháng
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Phòng để trống thì công tơ vẫn chạy, và không ai bị tính tiền. Thứ còn lại
        ở đây là tiền điện bạn đã trả mà chưa ghi vào sổ.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Tháng"
          size="small"
          value={`${period.year}-${period.month}`}
          onChange={(event) => {
            const [year, month] = event.target.value.split('-').map(Number)
            setPeriod({ year: year!, month: month! })
            // Entries belong to the month they were typed for.
            setRows({})
          }}
          sx={{ minWidth: 200 }}
        >
          {months.map((m) => (
            <MenuItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
              {monthLabel(m.year, m.month)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Toà nhà"
          size="small"
          value={buildingId === '' ? '' : String(buildingId)}
          onChange={(event) => {
            setBuildingId(event.target.value === '' ? '' : Number(event.target.value))
            setRows({})
          }}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">Tất cả toà nhà</MenuItem>
          {(buildingsQuery.data?.data ?? []).map((building) => (
            <MenuItem key={building.id} value={String(building.id)}>
              {building.displayName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {body()}
    </Box>
  )
}
