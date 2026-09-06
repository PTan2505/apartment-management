import { lazy, Suspense, useState } from 'react'
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
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useBuildings } from '@/features/buildings/hooks'
import { monthLabel, recentMonths } from '@/features/invoices/labels'
import { useRevenueReport } from '@/features/reports/hooks'
import type { BuildingReport, MonthFigures, Totals } from '@/features/reports/types'

/**
 * The chart, and the charting library with it, fetched only when this screen is
 * opened.
 *
 * `recharts` is the largest dependency in this application by a wide margin. In
 * one bundle it was downloaded by everyone who reached the sign-in page, for a
 * chart on a screen most sessions never visit. Split out, it is paid for by the
 * readers who actually asked for it.
 */
const RevenueTrendChart = lazy(() =>
  import('@/features/reports/RevenueTrendChart').then((m) => ({
    default: m.RevenueTrendChart,
  })),
)

/** `2026-08` from a `{year, month}`. */
function toParam(period: { year: number; month: number }): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}`
}

/**
 * A share of something, or nothing at all.
 *
 * Null when the denominator is zero. That case is not cosmetic: a range with
 * nothing billed makes every share 0/0, and the two obvious renderings are both
 * wrong. `NaN%` is a bug on screen. `0%` is a claim that nothing was collected,
 * which is a different statement from there having been nothing to collect —
 * and it is the statement an owner would act on.
 */
function share(part: number, whole: number): string | null {
  if (whole === 0) return null
  return `${((part / whole) * 100).toFixed(1)}%`
}

/**
 * One of the four figures the screen opens with.
 *
 * The share carries the name of its denominator. A bare percentage beside an
 * amount invites the reader to guess what it is a share of, and the guesses
 * differ enough to matter: 78% of what was billed in this range is not 78% of
 * everything ever owed.
 */
function HeadlineFigure({
  label,
  value,
  detail,
  percent,
  tone = 'default',
}: {
  label: string
  value: number
  detail: string
  percent: string | null
  tone?: 'default' | 'good' | 'bad'
}) {
  const color =
    tone === 'good' ? 'success.main' : tone === 'bad' ? 'error.main' : 'text.primary'

  return (
    <Card variant="outlined" sx={{ flex: '1 1 220px', minWidth: 0 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography
          variant="h5"
          component="p"
          sx={{ fontWeight: 700, mt: 0.5, wordBreak: 'break-word' }}
          color={color}
        >
          {formatMoney(value)}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            columnGap: 1,
            rowGap: 0.25,
            flexWrap: 'wrap',
            mt: 1.5,
            pt: 1.5,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {detail}
          </Typography>
          {percent !== null && (
            <Typography variant="caption" sx={{ fontWeight: 600 }} color={color}>
              {percent}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

/** A category, its amount, and how much of the total it is. */
function CategoryBar({
  label,
  amount,
  whole,
}: {
  label: string
  amount: number
  whole: number
}) {
  const percent = share(amount, whole)
  const width = whole === 0 ? 0 : Math.min(100, (amount / whole) * 100)

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          columnGap: 1,
          rowGap: 0.25,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {formatMoney(amount)}{' '}
          {percent !== null && (
            <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
              ({percent})
            </Box>
          )}
        </Typography>
      </Box>
      <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover', mt: 0.5 }}>
        <Box sx={{ height: '100%', width: `${width}%`, borderRadius: 3, bgcolor: 'primary.main' }} />
      </Box>
    </Box>
  )
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
  const entries = Object.entries(values)
    .filter(([, amount]) => amount !== 0)
    .sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return null

  // The whole these are parts OF. Summed from the entries rather than taken
  // from a total elsewhere: each of these maps partitions a different figure —
  // expenses partition spending, charges partition what was billed — and a
  // denominator borrowed from the wrong one would produce shares that do not
  // add to 100.
  const whole = entries.reduce((sum, [, amount]) => sum + amount, 0)

  return (
    <Box>
      <Typography variant="subtitle2">{title}</Typography>
      <Typography variant="caption" color="text.secondary">
        {partOf}
      </Typography>
      {/*
        Bars, the same as the expense breakdown above. Two presentations of one
        kind of data a few lines apart makes a reader look for a difference
        between them that is not there.
      */}
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {entries.map(([key, amount]) => (
          <CategoryBar
            key={key}
            label={labels?.[key] ?? key}
            amount={amount}
            whole={whole}
          />
        ))}
      </Stack>
    </Box>
  )
}

const EXPENSE_LABELS: Record<string, string> = {
  vacancy_electricity: 'Điện phòng trống',
  cleaning: 'Vệ sinh',
  repair: 'Sửa chữa',
  other: 'Khác',
}

const CHARGE_LABELS: Record<string, string> = {
  damage: 'Hư hỏng',
  cleaning: 'Vệ sinh',
  lost_item: 'Mất đồ',
  penalty: 'Phạt',
  other: 'Khác',
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
      <Typography variant="subtitle2">Tiền thực nhận trong tháng</Typography>
      <Typography variant="caption" color="text.secondary">
        Tính theo tháng NHẬN được tiền, bất kể hoá đơn xuất khi nào — nên nó cố ý
        KHÔNG khớp với bảng phía trên.
      </Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {active.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Không có tiền nào về trong khoảng này.
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
        {formatMoney(total.received)} trong cả khoảng
      </Typography>
    </Box>
  )
}

/**
 * The months of every building in the report, added together.
 *
 * Summing figures the API already sent, keyed on the month it already keyed
 * them on — not a second implementation of anything the server decides. The
 * report gives months per building and a grand total with no months, so this is
 * the only way to chart the range as a whole.
 *
 * `received` is carried through so the type stays honest, and is not charted.
 */
function mergeMonths(buildings: BuildingReport[]): MonthFigures[] {
  const byPeriod = new Map<string, MonthFigures>()

  for (const building of buildings) {
    for (const m of building.months) {
      const key = `${m.year}-${m.month}`
      const found = byPeriod.get(key)
      if (!found) {
        byPeriod.set(key, { ...m })
        continue
      }
      found.billed += m.billed
      found.settled += m.settled
      found.outstanding += m.outstanding
      found.expenses += m.expenses
      found.netBilled += m.netBilled
      found.netSettled += m.netSettled
      found.received += m.received
    }
  }

  return [...byPeriod.values()].sort((a, b) => a.year - b.year || a.month - b.month)
}

/**
 * What the owner came to find out, before any table.
 *
 * Four figures and the profit. Every one of them comes straight from the
 * report's own totals; the only arithmetic here is the shares, and `netBilled`
 * is the API's own figure rather than a subtraction repeated in the browser.
 */
function SummarySection({ total }: { total: Totals }) {
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <HeadlineFigure
          label="Đã xuất hoá đơn"
          value={total.billed}
          detail="Tiền đã ghi hoá đơn trong tháng, không tính cọc"
          percent={share(total.billed, total.billed)}
        />
        <HeadlineFigure
          label="Đã thu"
          value={total.settled}
          detail="Trong số đó, khách đã trả"
          percent={share(total.settled, total.billed)}
          tone="good"
        />
        <HeadlineFigure
          label="Còn nợ"
          value={total.outstanding}
          detail="Trong số đó, khách còn nợ"
          percent={share(total.outstanding, total.billed)}
          tone="bad"
        />
        <HeadlineFigure
          label="Chi phí"
          value={total.expenses}
          detail="Đã chi ra trong tháng"
          percent={share(total.expenses, total.billed)}
        />
      </Box>

      {/*
        The profit, stated rather than left as a subtraction — with the
        subtraction shown beside it so the figure can be checked. `netBilled` is
        the API's own, not recomputed here.
      */}
      <Card
        variant="outlined"
        sx={{ borderColor: 'primary.main', bgcolor: 'action.hover' }}
      >
        <CardContent>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Đã xuất hoá đơn trừ chi phí
              </Typography>
              <Typography variant="body2" color="text.secondary">
                = {formatMoney(total.billed)} − {formatMoney(total.expenses)}
                {share(total.netBilled, total.billed) !== null &&
                  ` · còn lại ${share(total.netBilled, total.billed)} trên tổng đã xuất hoá đơn`}
              </Typography>
            </Box>
            <Typography
              variant="h4"
              component="p"
              sx={{ fontWeight: 700, wordBreak: 'break-word' }}
              // A loss reads as a loss. A report that cannot express a bad month
              // is worse than one that says so plainly.
              color={total.netBilled < 0 ? 'error.main' : 'primary.main'}
            >
              {formatMoney(total.netBilled)}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}

function BuildingSection({
  report,
  /**
   * Whether the page has already stated these totals above.
   *
   * With one building in the report, the summary at the top IS this building's
   * summary, and repeating it here would print the same five figures twice on
   * one screen. The month table, the cash section and the charge breakdown are
   * not repeated anywhere, so they stay either way.
   */
  summarisedAbove,
}: {
  report: BuildingReport
  summarisedAbove: boolean
}) {
  const { total } = report

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{report.displayName}</Typography>

          {!summarisedAbove && (
          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
            <Figure
              label="Đã xuất hoá đơn"
              value={total.billed}
              hint="Tiền đã ghi hoá đơn trong tháng, không tính cọc"
            />
            <Figure label="Đã thu" value={total.settled} hint="Trong số đó, khách đã trả" />
            <Figure label="Còn nợ" value={total.outstanding} hint="Trong số đó, khách còn nợ" />
            <Figure label="Chi phí" value={total.expenses} hint="Đã chi ra trong tháng" />
            <Figure
              label="Còn lại"
              value={total.netBilled}
              hint="Đã xuất hoá đơn trừ chi phí"
              tone="loss"
            />
          </Stack>
          )}

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
                Xem các hoá đơn chưa trả
              </Button>
            </Box>
          )}

          <Divider />

          <TableContainer sx={{ display: { xs: 'none', [MOBILE_BREAKPOINT]: 'block' } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tháng</TableCell>
                  <TableCell align="right">Đã xuất HĐ</TableCell>
                  <TableCell align="right">Đã thu</TableCell>
                  <TableCell align="right">Còn nợ</TableCell>
                  <TableCell align="right">Chi phí</TableCell>
                  <TableCell align="right">Còn lại</TableCell>
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
                    <Typography variant="body2">Đã xuất HĐ {formatMoney(m.billed)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đã thu {formatMoney(m.settled)} · Còn nợ{' '}
                      {formatMoney(m.outstanding)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Chi phí {formatMoney(m.expenses)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500 }}
                      color={m.netBilled < 0 ? 'error.main' : 'text.primary'}
                    >
                      Còn lại {formatMoney(m.netBilled)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Divider />

          <ArrivedSection months={report.months} total={total} />

          {/*
            The expense breakdown is not repeated here when the page has already
            drawn it as bars above — one screen, one statement of a fact.
          */}
          {!summarisedAbove && (
            <Breakdown
              title="Chi phí theo loại"
              partOf={`Các phần của ${formatMoney(total.expenses)} chi phí`}
              values={total.expensesByCategory}
              labels={EXPENSE_LABELS}
            />
          )}

          <Breakdown
            title="Khoản bạn tự đặt, theo loại"
            partOf={`Đã nằm TRONG ${formatMoney(total.billed)} đã xuất hoá đơn — không cộng thêm`}
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
              Thử lại
            </Button>
          }
        >
          <AlertTitle>Không tải được báo cáo</AlertTitle>
          {errorMessage(reportQuery.error)}
        </Alert>
      )
    }

    if (!report || report.buildings.length === 0) {
      return (
        <Alert severity="info">
          <AlertTitle>Chưa có toà nhà nào để báo cáo</AlertTitle>
          Thêm toà nhà và xuất vài hoá đơn để thấy số liệu ở đây.
        </Alert>
      )
    }

    const merged = mergeMonths(report.buildings)
    const expenseEntries = Object.entries(report.total.expensesByCategory)
      .filter(([, amount]) => amount !== 0)
      .sort((a, b) => b[1] - a[1])

    return (
      <Stack spacing={2}>
        <SummarySection total={report.total} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              [MOBILE_BREAKPOINT]: 'minmax(0, 3fr) minmax(0, 2fr)',
            },
            gap: 2,
            alignItems: 'start',
          }}
        >
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Đối chiếu doanh thu theo tháng</Typography>
              {/*
                A reserved box, not a bare spinner: the chart is 300px tall, and
                a fallback of a different height makes the rest of the page jump
                when it lands.
              */}
              <Suspense
                fallback={
                  <Box
                    sx={{
                      height: 332,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CircularProgress size={24} />
                  </Box>
                }
              >
                <RevenueTrendChart months={merged} />
              </Suspense>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack
                direction="row"
                sx={{ justifyContent: 'space-between', alignItems: 'baseline', columnGap: 2 }}
              >
                <Typography variant="h6">Chi phí theo loại</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Tổng chi
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {formatMoney(report.total.expenses)}
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {expenseEntries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Không có chi phí nào trong khoảng này.
                  </Typography>
                ) : (
                  expenseEntries.map(([key, amount]) => (
                    <CategoryBar
                      key={key}
                      label={EXPENSE_LABELS[key] ?? key}
                      amount={amount}
                      whole={report.total.expenses}
                    />
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>

        {report.buildings.map((building) => (
          <BuildingSection
            key={building.buildingId}
            report={building}
            summarisedAbove={report.buildings.length === 1}
          />
        ))}

        {/*
          The grand total, reduced to the ONE figure the summary at the top does
          not state.

          Its five accrual figures used to be repeated here; the summary now
          carries them, and printing the same numbers twice on one screen invites
          a reader to look for a difference between them.

          The cash figure is what remains, and it keeps a card to itself rather
          than joining the four above. That is the whole design of this screen:
          it is keyed on the day money ARRIVED, the others on the month an
          invoice was ISSUED, and side by side they read as a discrepancy in a
          report rather than as two different questions.
        */}
        {report.buildings.length > 1 && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6">Tất cả các toà nhà</Typography>
              <Typography variant="subtitle2" sx={{ mt: 1 }}>
                Tiền thực nhận
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tiền vào tay, tính theo ngày nhận — bất kể hoá đơn xuất tháng nào, nên nó
                cố ý KHÔNG khớp với các con số phía trên.
              </Typography>
              <Typography variant="h5" component="p" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatMoney(report.total.received)}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    )
  }

  return (
    <Box>
      <Typography variant="h5" component="h2" sx={{ mb: 0.5 }}>
        Doanh thu
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Các toà nhà đã xuất hoá đơn bao nhiêu, thu được bao nhiêu, và tốn của bạn bao nhiêu.
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Từ"
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
          label="Đến"
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
          label="Toà nhà"
          size="small"
          value={buildingIds.length === 1 ? String(buildingIds[0]) : ''}
          onChange={(event) =>
            setBuildingIds(event.target.value === '' ? [] : [Number(event.target.value)])
          }
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

      {/*
        The API refuses a range whose start is after its end. Caught here so the
        owner sees the problem in the picker rather than as a failed request.
      */}
      {from.year * 12 + from.month > to.year * 12 + to.month && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Tháng bắt đầu đang sau tháng kết thúc.
        </Alert>
      )}

      {body()}
    </Box>
  )
}
