import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatMoney } from '@/lib/format'
import { monthLabel } from '@/features/invoices/labels'
import type { MonthFigures } from '@/features/reports/types'

/**
 * The months as a shape.
 *
 * ── What this chart may and may not draw ────────────────────────────────────
 *
 * `billed` and `settled` ONLY. Both are keyed on the month an invoice was
 * ISSUED, so a shared month axis says something true about them: the gap
 * between the two bars is what that month billed and has not yet collected.
 *
 * `received` is keyed on the day money ARRIVED. Drawn as a third bar it would
 * silently claim the same keying as its neighbours, and a reader would take the
 * gap between it and `billed` for an amount owed. It is not — an invoice issued
 * in March and paid in May belongs to March's settled and May's received.
 *
 * That rule already governed the figures on this screen. A chart is simply a
 * new way to break it, which is why the spec now names charts explicitly.
 */

/** Millions, because a column of nine-digit tick labels is unreadable. */
const MILLION = 1_000_000

interface Point {
  key: string
  label: string
  billed: number
  settled: number
}

export function RevenueTrendChart({ months }: { months: MonthFigures[] }) {
  const theme = useTheme()

  // A chart is a claim about direction, and one bar makes no claim while
  // looking exactly like one that does. Below two months there is nothing
  // honest to draw, so it says so instead.
  if (months.length < 2) {
    return (
      <Typography variant="body2" color="text.secondary">
        Khoảng đang chọn chỉ có một tháng — chưa đủ để vẽ xu hướng.
      </Typography>
    )
  }

  const data: Point[] = months.map((m) => ({
    key: `${m.year}-${m.month}`,
    label: `${String(m.month).padStart(2, '0')}/${String(m.year).slice(2)}`,
    billed: m.billed / MILLION,
    settled: m.settled / MILLION,
  }))

  const first = months[0]!
  const last = months[months.length - 1]!

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div">
        {/*
          The period and the unit, stated. A bar of height 4 means nothing until
          the reader knows whether that is four million or four hundred.
        */}
        Chu kỳ {monthLabel(first.year, first.month)} – {monthLabel(last.year, last.month)} (Đơn vị:
        triệu đồng)
      </Typography>

      <Box sx={{ height: 300, mt: 1, mx: -1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => `${Math.round(value)} tr`}
            />
            <Tooltip
              // The tooltip shows the real amount, not the millions the axis is
              // scaled to — the axis exists to be readable, the tooltip to be
              // exact.
              formatter={(value, name) => [
                typeof value === 'number' ? formatMoney(value * MILLION) : '—',
                name,
              ]}
              labelFormatter={(label) => `Tháng ${String(label)}`}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
              iconType="square"
              iconSize={10}
            />
            {/*
              The names the screen already uses. The design labels the second
              series "Đã thu thực tế" — not adopted: "thực tế" is the phrase the
              CASH figure has earned here, and lending it to an accrual series
              would undo in a caption the distinction the screen is built on.
            */}
            <Bar
              dataKey="billed"
              name="Đã xuất hoá đơn"
              fill={theme.palette.grey[400]}
              radius={[3, 3, 0, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="settled"
              name="Đã thu"
              fill={theme.palette.primary.main}
              radius={[3, 3, 0, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
