import { useState } from 'react'
import { Link as RouterLink } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useBuildings } from '@/features/buildings/hooks'
import { monthLabel, recentMonths } from '@/features/invoices/labels'
import { useRevenueReport } from '@/features/reports/hooks'
import type { BuildingReport, MonthFigures, Totals } from '@/features/reports/types'

/** `2026-08` from a `{year, month}`. */
function toParam(period: { year: number; month: number }): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`
}

/** A figure and what it is, for the summary rows. */
function Figure({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: number
  hint?: string
  tone?: 'default' | 'loss'
}) {
  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="h6"
        // A loss is rendered as a loss rather than clamped or hidden. A report
        // that cannot express a bad month is worse than one that says so.
        color={tone === 'loss' && value < 0 ? 'error.main' : 'text.primary'}
      >
        {formatMoney(value)}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

/**
 * A breakdown of a figure already shown.
 *
 * `partOf` is stated on purpose: `chargesByCategory` is a PARTITION of what was
 * billed, and a reader who meets it as its own total beside `billed` will add
 * the two and count the same money twice. One heading's worth of care prevents
 * exactly the error the API's shape was designed to prevent.
 */
function Breakdown({
  title,
  partOf,
  values,
  labels,
}: {
  title: string
  partOf: string
  values: Record<string, number>
  labels?: Record<string, string>
}) {
  const entries = Object.entries(values).filter(([, amount]) => amount !== 0)
  if (entries.length === 0) return null

  return (
    <Box>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="caption" color="text.secondary">
        {partOf}
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
        {entries.map(([key, amount]) => (
          <Chip
            key={key}
            size="small"
            variant="outlined"
            label={`${labels?.[key] ?? key}: ${formatMoney(amount)}`}
          />
        ))}
      </Stack>
    </Box>
  )
}

const EXPENSE_LABELS: Record<string, string> = {
  vacancy_electricity: 'Vacancy electricity',
  cleaning: 'Cleaning',
  repair: 'Repair',
  other: 'Other',
}

const CHARGE_LABELS: Record<string, string> = {
  damage: 'Damage',
  cleaning: 'Cleaning',
  lost_item: 'Lost item',
  penalty: 'Penalty',
  other: 'Other',
}

/**
 * One month's accrual figures.
 *
 * `received` is deliberately absent from this table — see `ArrivedSection`.
 */
function MonthRow({ figures }: { figures: MonthFigures }) {
  return (
    <TableRow>
      <TableCell>{monthLabel(figures.year, figures.month)}</TableCell>
      {/*
        These three are kept adjacent and in this order because
        billed = settled + outstanding exactly, and that identity is the
        reader's only way to check the table against itself.
      */}
      <TableCell align="right">{formatMoney(figures.billed)}</TableCell>
      <TableCell align="right">{formatMoney(figures.settled)}</TableCell>
      <TableCell align="right">{formatMoney(figures.outstanding)}</TableCell>
      <TableCell align="right">{formatMoney(figures.expenses)}</TableCell>
      <TableCell align="right">
        <Typography
          variant="body2"
          color={figures.netBilled < 0 ? 'error.main' : 'text.primary'}
        >
          {formatMoney(figures.netBilled)}
        </Typography>
      </TableCell>
    </TableRow>
  )
}

/**
 * The cash figure, in a section of its own.
 *
 * This is the one layout decision the whole screen exists to get right. Placed
 * as a column beside `settled`, the two read as a discrepancy: an invoice
 * issued in March and paid in May sits in March's settled and May's arrived,
 * and a reader who notices an unexplained disagreement between two adjacent
 * numbers concludes the report is broken rather than that they measure
 * different things — and then stops trusting the rest of it.
 *
 * So it sits apart, says what it counts, and is never differenced against
 * anything.
 */
function ArrivedSection({ months, total }: { months: MonthFigures[]; total: Totals }) {
  const active = months.filter((m) => m.received !== 0)

  return (
    <Box>
      <Typography variant="subtitle2">Money that actually arrived</Typography>
      <Typography variant="caption" color="text.secondary">
        Counted in the month the payment was taken, whenever the bill was issued
        — so this deliberately does not line up with the table above.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {active.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No money arrived in this range.
          </Typography>
        ) : (
          active.map((m) => (
            <Chip
              key={`${m.year}-${m.month}`}
              size="small"
              label={`${monthLabel(m.year, m.month)}: ${formatMoney(m.received)}`}
            />
          ))
        )}
      </Stack>
      <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
        {formatMoney(total.received)} across the range
      </Typography>
    </Box>
  )
}

function BuildingSection({ report }: { report: BuildingReport }) {
  const { total } = report

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{report.displayName}</Typography>

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
            <Figure
              label="Billed"
              value={total.billed}
              hint="Revenue billed out, deposits excluded"
            />
            <Figure label="Settled" value={total.settled} hint="Of that, since paid" />
            <Figure label="Outstanding" value={total.outstanding} hint="Of that, still owed" />
            <Figure label="Spent" value={total.expenses} hint="Costs incurred" />
            <Figure
              label="Net"
              value={total.netBilled}
              hint="Billed less spent"
              tone="loss"
            />
          </Stack>

          {total.outstanding > 0 && (
            <Box>
              {/*
                "Who has not paid" is the next question a reader of that figure
                has, and the filter already exists. A report that states a
                problem and offers no route to it makes the reader assemble the
                same query by hand every time.
              */}
              <Button
                size="small"
                startIcon={<ReceiptLongIcon />}
                component={RouterLink}
                to={`/invoices?buildingId=${report.buildingId}&paymentStatus=pending`}
              >
                See the unpaid bills
              </Button>
            </Box>
          )}

          <Divider />

          <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Month</TableCell>
                  <TableCell align="right">Billed</TableCell>
                  <TableCell align="right">Settled</TableCell>
                  <TableCell align="right">Outstanding</TableCell>
                  <TableCell align="right">Spent</TableCell>
                  <TableCell align="right">Net</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {/*
                  Every month in the range, including empty ones. A gap reads as
                  data that failed to load; a zero is a statement about that
                  month.
                */}
                {report.months.map((m) => (
                  <MonthRow key={`${m.year}-${m.month}`} figures={m} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Phone: six figures per month do not fit a row. */}
          <Stack spacing={1.5} sx={{ display: { xs: 'flex', [MOBILE_BREAKPOINT]: 'none' } }}>
            {report.months.map((m) => (
              <Card key={`${m.year}-${m.month}`} variant="outlined">
                <CardContent sx={{ py: 1.5 }}>
                  <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                    {monthLabel(m.year, m.month)}
                  </Typography>
                  <Stack spacing={0.25}>
                    <Typography variant="body2">Billed {formatMoney(m.billed)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Settled {formatMoney(m.settled)} · Outstanding{' '}
                      {formatMoney(m.outstanding)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Spent {formatMoney(m.expenses)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500 }}
                      color={m.netBilled < 0 ? 'error.main' : 'text.primary'}
                    >
                      Net {formatMoney(m.netBilled)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Divider />

          <ArrivedSection months={report.months} total={total} />

          <Breakdown
            title="What was spent, by kind"
            partOf={`Parts of the ${formatMoney(total.expenses)} spent`}
            values={total.expensesByCategory}
            labels={EXPENSE_LABELS}
          />

          <Breakdown
            title="Charges you decided, by kind"
            partOf={`Already counted inside the ${formatMoney(total.billed)} billed — not an addition to it`}
            values={total.chargesByCategory}
            labels={CHARGE_LABELS}
          />
        </Stack>
      </CardContent>
    </Card>
  )
}

export function RevenueReportPage() {
  const months = recentMonths()
  // Six months back to last month. Long enough to show a trend, short enough
  // to read without scrolling — and never empty, because a screen that opens
  // with no range asks a question instead of answering one.
  const [from, setFrom] = useState(() => months[6] ?? months[months.length - 1]!)
  const [to, setTo] = useState(() => months[1] ?? months[0]!)
  const [buildingIds, setBuildingIds] = useState<number[]>([])

  const buildingsQuery = useBuildings({ pageSize: 200 })
  const reportQuery = useRevenueReport({
    from: toParam(from),
    to: toParam(to),
    buildingIds,
  })

  const report = reportQuery.data

  function body() {
    if (reportQuery.isPending) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (reportQuery.error) {
      return (
        <Alert
          severity={
            isApiError(reportQuery.error) && reportQuery.error.isTransport ? 'warning' : 'error'
          }
          action={
            <Button color="inherit" size="small" onClick={() => void reportQuery.refetch()}>
              Retry
            </Button>
          }
        >
          <AlertTitle>Could not load the report</AlertTitle>
          {isApiError(reportQuery.error)
            ? reportQuery.error.message
            : 'An unexpected error occurred.'}
        </Alert>
      )
    }

    if (!report || report.buildings.length === 0) {
      return (
        <Alert severity="info">
          <AlertTitle>No buildings to report on</AlertTitle>
          Add a building and record some billing to see figures here.
        </Alert>
      )
    }

    return (
      <Stack spacing={2}>
        {report.buildings.map((building) => (
          <BuildingSection key={building.buildingId} report={building} />
        ))}

        {/*
          The grand total appears only where there is more than one building to
          total. With one, it would restate the section above it word for word.
        */}
        {report.buildings.length > 1 && (
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Across all buildings</Typography>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                  <Figure label="Billed" value={report.total.billed} />
                  <Figure label="Settled" value={report.total.settled} />
                  <Figure label="Outstanding" value={report.total.outstanding} />
                  <Figure label="Spent" value={report.total.expenses} />
                  <Figure label="Net" value={report.total.netBilled} tone="loss" />
                  <Figure
                    label="Arrived"
                    value={report.total.received}
                    hint="Money taken in, by payment date"
                  />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Stack>
    )
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Revenue
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        What your buildings billed, what has been paid, and what they cost you.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          select
          label="From"
          size="small"
          value={toParam(from)}
          onChange={(event) => {
            const [year, month] = event.target.value.split('-').map(Number)
            setFrom({ year: year!, month: month! })
          }}
          sx={{ minWidth: 180 }}
        >
          {months.map((m) => (
            <MenuItem key={toParam(m)} value={toParam(m)}>
              {monthLabel(m.year, m.month)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="To"
          size="small"
          value={toParam(to)}
          onChange={(event) => {
            const [year, month] = event.target.value.split('-').map(Number)
            setTo({ year: year!, month: month! })
          }}
          sx={{ minWidth: 180 }}
        >
          {months.map((m) => (
            <MenuItem key={toParam(m)} value={toParam(m)}>
              {monthLabel(m.year, m.month)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Buildings"
          size="small"
          value={buildingIds.length === 1 ? String(buildingIds[0]) : ''}
          onChange={(event) =>
            setBuildingIds(event.target.value === '' ? [] : [Number(event.target.value)])
          }
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All buildings</MenuItem>
          {(buildingsQuery.data?.data ?? []).map((building) => (
            <MenuItem key={building.id} value={String(building.id)}>
              {building.displayName}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/*
        The API refuses a range whose start is after its end. Caught here so the
        owner sees the problem in the picker rather than as a failed request.
      */}
      {from.year * 12 + from.month > to.year * 12 + to.month && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The first month is after the last one.
        </Alert>
      )}

      {body()}
    </Box>
  )
}
