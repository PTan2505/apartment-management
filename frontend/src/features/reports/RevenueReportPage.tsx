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
import { errorMessage } from '@/lib/error-messages'
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

function BuildingSection({ report }: { report: BuildingReport }) {
  const { total } = report

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">{report.displayName}</Typography>

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

          <Breakdown
            title="Chi phí theo loại"
            partOf={`Các phần của ${formatMoney(total.expenses)} chi phí`}
            values={total.expensesByCategory}
            labels={EXPENSE_LABELS}
          />

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
                <Typography variant="h6">Tất cả các toà nhà</Typography>
                <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', rowGap: 2 }}>
                  <Figure label="Đã xuất hoá đơn" value={report.total.billed} />
                  <Figure label="Đã thu" value={report.total.settled} />
                  <Figure label="Còn nợ" value={report.total.outstanding} />
                  <Figure label="Chi phí" value={report.total.expenses} />
                  <Figure label="Còn lại" value={report.total.netBilled} tone="loss" />
                  <Figure
                    label="Tiền thực nhận"
                    value={report.total.received}
                    hint="Tiền vào tay, tính theo ngày nhận"
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
