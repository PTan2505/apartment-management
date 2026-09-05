import { useState } from 'react'
import { useSearchParams } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
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
import { alpha } from '@mui/material/styles'
import visuallyHidden from '@mui/utils/visuallyHidden'

import { isApiError } from '@/lib/api-error'
import { errorMessage } from '@/lib/error-messages'
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

/**
 * What the owner has typed for a row, and what came of it.
 *
 * `failed` and `rejected` are both failures, and are kept apart because they
 * deserve opposite controls. A transport failure is worth pressing again — the
 * request never arrived. A rejection is the server's verdict on this exact
 * reading, so offering the button again invites the owner to produce the same
 * refusal as many times as they have patience for. Editing the reading returns
 * the row to `idle`, which is what makes the block escapable.
 */
interface RowState {
  reading: string
  status: 'idle' | 'issuing' | 'failed' | 'rejected'
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
  /**
   * The months this control offers, which must always include the one selected.
   *
   * `recentMonths` lists this month and the ones behind it, and the address may
   * legitimately name something outside that window. When it did, the Select
   * held the right value with no option matching it, and MUI rendered the
   * control BLANK — the screen was showing one month's work above a filter that
   * appeared to have no month at all.
   *
   * Fixed by widening the list rather than by overriding the address: silently
   * moving the owner to a different month would strand exactly the person the
   * address-wins rule above exists to protect.
   */
  const monthOptions = months.some((m) => m.year === period.year && m.month === period.month)
    ? months
    : [period, ...months]

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

  /**
   * What this row will actually bill, as it is typed.
   *
   * Null until the entry parses as a whole number at or above the opening
   * reading — a half-typed "16" against an opening of 1620 is not a consumption
   * of minus 1604, it is somebody in the middle of typing. Showing nothing
   * there is the honest answer; showing a figure would be a wrong fact.
   */
  function consumption(row: DueForMonth, entry: string): number | null {
    const reading = parseReading(entry)
    if (reading === null || reading < row.previousElectricityUse) return null
    return reading - row.previousElectricityUse
  }

  /**
   * Where the row stands, derived rather than stored.
   *
   * A fourth field on the state map would be a second source for a fact the
   * first three already determine, and the familiar bug is a row corrected
   * while its status is not.
   */
  function rowStatus(row: DueForMonth): 'entered' | 'waiting' | 'error' {
    const state = rows[row.leaseId]
    // A reading the server refused is not an entered row, however well it
    // parses. Reporting it green beside its own red refusal contradicts the
    // message underneath, and counts a room as done that produced no invoice.
    if (state?.status === 'failed' || state?.status === 'rejected') return 'error'
    const entry = state?.reading ?? ''
    if (entry.trim() === '') return 'waiting'
    return localProblem(row, entry) === null ? 'entered' : 'error'
  }

  const entered = due?.filter((row) => rowStatus(row) === 'entered') ?? []
  const totalUse = entered.reduce(
    (sum, row) => sum + (consumption(row, rows[row.leaseId]?.reading ?? '') ?? 0),
    0,
  )

  function StatusChip({ row }: { row: DueForMonth }) {
    const status = rowStatus(row)
    if (status === 'entered') {
      return <Chip size="small" color="success" variant="outlined" label="Đã nhập" />
    }
    if (status === 'error') {
      // Two different failures, and the chip should not claim the wrong one. A
      // reading below the opening one IS a data error; "this month is already
      // billed" is a refusal that says nothing about what was typed.
      const state = rows[row.leaseId]
      const fromServer = state?.status === 'failed' || state?.status === 'rejected'
      const local = localProblem(row, state?.reading ?? '') !== null
      return (
        <Chip
          size="small"
          color="error"
          variant="outlined"
          label={fromServer && !local ? 'Bị từ chối' : 'Lỗi số liệu'}
        />
      )
    }
    return <Chip size="small" color="default" variant="outlined" label="Chờ ghi" />
  }

  /**
   * The consumption cell: what will be billed, and the rate it meets.
   *
   * The rate sits on the ROW rather than in one line above the table, which is
   * where the design puts it. With every building shown at once the rows carry
   * different rates — 3.500 and 4.000 appear together in this database — and a
   * single figure at the top would be false for some of the rows beneath it.
   */
  function UsageCell({ row, labelled = false }: { row: DueForMonth; labelled?: boolean }) {
    const used = consumption(row, rows[row.leaseId]?.reading ?? '')
    return (
      <Box>
        {/*
         * The table names this figure in its column header. A card has no
         * header, so without a label of its own the mobile layout shows a bare
         * dash and the reader has no way to know what it stands for.
         */}
        {labelled && (
          <Typography variant="caption" color="text.secondary" component="div">
            Số điện dùng
          </Typography>
        )}
        <Typography variant="body2" sx={{ fontWeight: used === null ? 400 : 600 }}>
          {used === null ? '—' : `${used} kWh`}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          × {formatMoney(row.electricityRate)}/kWh
        </Typography>
      </Box>
    )
  }

  async function issue(row: DueForMonth) {
    const entry = rows[row.leaseId]?.reading ?? ''
    const problem = localProblem(row, entry)
    if (problem) {
      setRow(row.leaseId, { status: 'rejected', error: problem })
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
      // A 4xx is the server's verdict on this reading and will not change on a
      // second press. Anything else — a transport failure, a 5xx — might, so
      // the row stays pressable.
      const permanent = isApiError(cause) && cause.isClientError
      setRow(row.leaseId, {
        status: permanent ? 'rejected' : 'failed',
        error: errorMessage(cause),
      })
    }
  }

  /** A rejection the server already gave for exactly what is in the field now. */
  function isRejected(row: DueForMonth): boolean {
    return rows[row.leaseId]?.status === 'rejected'
  }

  function rowError(row: DueForMonth): string | undefined {
    const state = rows[row.leaseId]
    if (state?.status === 'failed' || state?.status === 'rejected') return state.error
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
          {errorMessage(dueQuery.error)}
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

        {/*
          Where the round stands. The denominator is what is STILL on the list,
          not what was billed today: rows leave as they are issued, so counting
          the billed ones would give a figure that climbs and then falls while
          the owner works.

          It reports; it does not gate. The screen may say three rooms are still
          waiting and must still issue the seven that are ready.
        */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Đã nhập {entered.length}/{due.length} phòng
          {totalUse > 0 && ` · tổng ${totalUse} kWh`}
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
                <TableCell align="right">Số điện dùng</TableCell>
                <TableCell>Trạng thái</TableCell>
                {/*
                  Named, but not drawn. A blank header is blank only to someone
                  looking at it: a screen reader announces the column by its
                  header, and an empty one leaves the button in each row with no
                  stated purpose. The design has no visible label here, so the
                  name is given to assistive technology alone.
                */}
                <TableCell align="right">
                  <Box component="span" sx={visuallyHidden}>
                    Thao tác
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {due.map((row) => (
                <TableRow
                  key={row.leaseId}
                  /*
                    A TINT, not the error colour itself. The first version used
                    `error.main` and filled the row solid dark red, which hid
                    the message and the status chip — it destroyed exactly the
                    information the highlight exists to draw attention to.
                    Caught by reading the computed background back: rgb(185,28,28).
                  */
                  sx={
                    rowStatus(row) === 'error'
                      ? (theme) => ({ bgcolor: alpha(theme.palette.error.main, 0.08) })
                      : undefined
                  }
                >
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
                      {row.previousElectricityUse} kWh
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
                      // Enter issues the row being typed. Readings arrive ten
                      // at a time off a sheet of paper, and a trip to the mouse
                      // between each one is paid once per room.
                      //
                      // It calls the same `issue`, not a parallel path, so a
                      // reading the screen has already rejected is refused
                      // identically and there is one place to change.
                      onKeyDown={(event) => {
                        if (event.key !== 'Enter') return
                        event.preventDefault()
                        void issue(row)
                      }}
                      slotProps={{ htmlInput: { min: row.previousElectricityUse, step: 1 } }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <UsageCell row={row} />
                  </TableCell>
                  <TableCell>
                    <StatusChip row={row} />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      disabled={
                        rows[row.leaseId]?.status === 'issuing' ||
                        isRejected(row) ||
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
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600 }}>{row.room.roomCode}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.tenant?.fullName ?? '—'}
                        {row.building && !buildingId ? ` · ${row.building.displayName}` : ''}
                      </Typography>
                    </Box>
                    <StatusChip row={row} />
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
                    helperText={rowError(row) ?? `Số đầu kỳ ${row.previousElectricityUse} kWh`}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter') return
                      event.preventDefault()
                      void issue(row)
                    }}
                    slotProps={{
                      htmlInput: { min: row.previousElectricityUse, step: 1 },
                      inputLabel: { shrink: true },
                    }}
                  />
                  <UsageCell row={row} labelled />
                  <Button
                    variant="contained"
                    disabled={
                      rows[row.leaseId]?.status === 'issuing' ||
                      isRejected(row) ||
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
          {monthOptions.map((m) => (
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
