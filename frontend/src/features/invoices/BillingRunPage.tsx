import { useState } from 'react'
import { useSearchParams } from 'react-router'
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
import { useDueForMonth, useGenerateInvoice } from '@/features/invoices/hooks'
import { monthLabel, recentMonths } from '@/features/invoices/labels'
import type { DueForMonth } from '@/features/invoices/types'

/**
 * Closing off a month.
 *
 * ── Why this is a table and not a form ──────────────────────────────────────
 *
 * Billing is not an event that happens to one tenancy; it is a round the owner
 * makes. They walk the building reading meters, then sit down and enter what
 * they read. A screen that bills one tenancy at a time turns twenty rooms into
 * twenty journeys through the same form — and, worse, leaves no way to know
 * which rooms have already been done.
 *
 * So: what remains on the table is what remains to be done. A tenancy leaves
 * the list the moment its invoice exists. That is the entire answer to "which
 * rooms have I not billed yet", given by the shape of the screen rather than by
 * a warning somebody has to notice.
 *
 * ── Why the rows are issued one at a time ───────────────────────────────────
 *
 * A batch request is the obvious design and the wrong one. Twenty invoices in
 * one transaction fail as a unit: one bad reading rolls back nineteen correct
 * bills and reports a single error the owner has to trace back to a row. Issued
 * per row, a failure belongs to the row that caused it, the rest stand, and
 * retrying costs one request. It also matches how the work actually stops —
 * an owner interrupted halfway has genuinely billed what they got through.
 */

/** What the owner has typed for a row, and what came of it. */
interface RowState {
  reading: string
  status: 'idle' | 'issuing' | 'failed'
  error?: string
}

function parseReading(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
}

export function BillingRunPage() {
  const months = recentMonths()
  const [searchParams] = useSearchParams()

  const [period, setPeriod] = useState(() => {
    // A month named in the address wins. Withdrawing a bill sends the owner
    // here to reissue it, and landing them on a different month's work — with
    // their room nowhere in sight — would strand them mid-correction.
    const year = Number(searchParams.get('year'))
    const month = Number(searchParams.get('month'))
    if (Number.isInteger(year) && year > 2000 && month >= 1 && month <= 12) {
      return { year, month }
    }
    // Otherwise LAST month, not this one. A month is billed once it is over —
    // its utilities are not known until then — so the month an owner opens this
    // screen to close off is almost never the one they are standing in.
    return months[1] ?? months[0]!
  })
  const [buildingId, setBuildingId] = useState<number | ''>('')
  const [rows, setRows] = useState<Record<number, RowState>>({})

  const buildingsQuery = useBuildings({ pageSize: 200 })
  const dueQuery = useDueForMonth(
    period.year,
    period.month,
    buildingId === '' ? undefined : buildingId,
  )
  const generate = useGenerateInvoice()

  const due = dueQuery.data ?? []

  function setRow(leaseId: number, patch: Partial<RowState>) {
    setRows((current) => ({
      ...current,
      [leaseId]: {
        ...(current[leaseId] ?? { reading: '', status: 'idle' as const }),
        ...patch,
      },
    }))
  }

  /**
   * The one thing checked here rather than left to the API: a closing reading
   * below the one the invoice opens from.
   *
   * This is not a client-side copy of any charge calculation — deliberately,
   * nothing here computes consumption or money. It is catching a typo against a
   * number already on the screen, which is the commonest mistake in the whole
   * operation and the cheapest place to catch it.
   */
  function localProblem(row: DueForMonth, entry: string): string | null {
    const reading = parseReading(entry)
    if (reading === null) return 'Nhập một số nguyên'
    if (reading < row.previousElectricityUse) {
      return `Thấp hơn số đầu kỳ ${row.previousElectricityUse}`
    }
    return null
  }

  async function issue(row: DueForMonth) {
    const entry = rows[row.leaseId]?.reading ?? ''
    const problem = localProblem(row, entry)
    if (problem) {
      setRow(row.leaseId, { status: 'failed', error: problem })
      return
    }

    setRow(row.leaseId, { status: 'issuing', error: undefined })
    try {
      await generate.mutateAsync({
        leaseId: row.leaseId,
        year: period.year,
        month: period.month,
        currentElectricityUse: parseReading(entry)!,
      })
      // Nothing to clear: the row leaves the list when it refetches, which is
      // the whole point of the screen.
    } catch (cause) {
      setRow(row.leaseId, {
        status: 'failed',
        error: isApiError(cause) ? cause.message : 'Không xuất được hoá đơn này.',
      })
    }
  }

  function rowError(row: DueForMonth): string | undefined {
    const state = rows[row.leaseId]
    if (state?.status === 'failed') return state.error
    // Shown while typing too, so the mistake is visible before it is submitted.
    const entry = state?.reading ?? ''
    if (entry.trim() === '') return undefined
    return localProblem(row, entry) ?? undefined
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
          <AlertTitle>Không tải được danh sách cần xuất</AlertTitle>
          {isApiError(dueQuery.error) ? dueQuery.error.message : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (due.length === 0) {
      // Said out loud rather than shown as an empty table. An empty table reads
      // as a screen that failed to load, and "nothing left to do" is the most
      // reassuring thing this screen can say.
      return (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <AlertTitle>{monthLabel(period.year, period.month)} đã xong</AlertTitle>
          Mọi hợp đồng có người ở trong tháng đó đều đã được xuất hoá đơn.
        </Alert>
      )
    }

    return (
      <>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {due.length === 1
            ? 'Còn 1 hợp đồng chưa xuất'
            : `Còn ${due.length} hợp đồng chưa xuất`}{' '}
          — mỗi dòng biến mất khi đã xuất hoá đơn.
        </Typography>

        {/* Desktop */}
        <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Phòng</TableCell>
                <TableCell>Người đứng tên</TableCell>
                <TableCell align="right">Số đầu kỳ</TableCell>
                <TableCell>Số điện cuối kỳ</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {due.map((row) => (
                <TableRow key={row.leaseId}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {row.room.roomCode}
                    </Typography>
                    {!buildingId && row.building && (
                      <Typography variant="caption" color="text.secondary">
                        {row.building.displayName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.tenant?.fullName ?? '—'}</Typography>
                  </TableCell>
                  {/*
                    Beside the field, not hidden behind a tooltip. A meter
                    reading means nothing on its own — what is billed is the
                    difference — so an owner cannot tell a plausible typo from a
                    correct figure without the number it will be subtracted from.
                  */}
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {row.previousElectricityUse}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <TextField
                      size="small"
                      type="number"
                      fullWidth
                      value={rows[row.leaseId]?.reading ?? ''}
                      onChange={(event) =>
                        setRow(row.leaseId, { reading: event.target.value, status: 'idle' })
                      }
                      error={rowError(row) !== undefined}
                      helperText={rowError(row)}
                      slotProps={{ htmlInput: { min: row.previousElectricityUse, step: 1 } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      disabled={
                        rows[row.leaseId]?.status === 'issuing' ||
                        localProblem(row, rows[row.leaseId]?.reading ?? '') !== null
                      }
                      onClick={() => void issue(row)}
                    >
                      {rows[row.leaseId]?.status === 'issuing' ? 'Đang xuất…' : 'Xuất'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/*
          Phone. The billing round is the case that matters here — the owner may
          be entering readings while standing in the building — so each tenancy
          becomes a card with its field beneath it rather than a row that has to
          be scrolled sideways to reach.
        */}
        <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
          {due.map((row) => (
            <Card key={row.leaseId} variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ fontWeight: 600 }}>{row.room.roomCode}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {row.tenant?.fullName ?? '—'}
                      {row.building && !buildingId ? ` · ${row.building.displayName}` : ''}
                    </Typography>
                  </Box>
                  <TextField
                    size="small"
                    type="number"
                    fullWidth
                    label="Số điện cuối kỳ"
                    value={rows[row.leaseId]?.reading ?? ''}
                    onChange={(event) =>
                      setRow(row.leaseId, { reading: event.target.value, status: 'idle' })
                    }
                    error={rowError(row) !== undefined}
                    helperText={rowError(row) ?? `Số đầu kỳ ${row.previousElectricityUse}`}
                    slotProps={{
                      htmlInput: { min: row.previousElectricityUse, step: 1 },
                      inputLabel: { shrink: true },
                    }}
                  />
                  <Button
                    variant="contained"
                    disabled={
                      rows[row.leaseId]?.status === 'issuing' ||
                      localProblem(row, rows[row.leaseId]?.reading ?? '') !== null
                    }
                    onClick={() => void issue(row)}
                  >
                    {rows[row.leaseId]?.status === 'issuing' ? 'Đang xuất…' : 'Xuất hoá đơn'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    Giá thuê {formatMoney(row.baseRent)} · tính cho {row.occupantCount}{' '}
                    người
                  </Typography>
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
        Chốt sổ tháng
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Mọi hợp đồng đáng ra phải xuất hoá đơn cho tháng này mà chưa xuất. Làm dần
        từ trên xuống — thứ còn lại là thứ còn phải làm.
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
            // Entries belong to the month they were typed for; carrying them
            // across would attach a reading to the wrong bill.
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
