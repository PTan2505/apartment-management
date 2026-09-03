import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { formatMoney } from '@/lib/format'
import { lineLabel } from '@/lib/invoice-lines'
import type { PortalInvoice } from '@/portal/api'

/** What a tenant calls each kind of bill. The API's own names are for the owner. */
const KIND_LABEL: Record<string, string> = {
  moveIn: 'Nhận phòng',
  monthly: 'Hàng tháng',
  final: 'Kết thúc hợp đồng',
  overdue: 'Ở quá hạn',
  adhoc: 'Khoản phát sinh',
}


function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN')
}

function formatPeriod(from: string | null, to: string | null): string | null {
  if (!from || !to) return null
  return `${formatDate(from)} – ${formatDate(to)}`
}

interface Props {
  invoice: PortalInvoice
  expanded: boolean
  onToggle: () => void
  children?: React.ReactNode
}

export function InvoiceCard({ invoice, expanded, onToggle, children }: Props) {
  const covers =
    invoice.coversYear && invoice.coversMonth
      ? `tháng ${invoice.coversMonth}/${invoice.coversYear}`
      : null

  return (
    <Accordion expanded={expanded} onChange={onToggle} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack spacing={0.5} sx={{ width: '100%', pr: 1 }}>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 600 }}>
              {KIND_LABEL[invoice.kind] ?? invoice.kind}
              {covers ? ` · ${covers}` : ''}
            </Typography>
            {/*
              Paid and unpaid are told apart by a labelled colour, not by
              comparing amounts — someone scanning the list should not have to
              read a number to work out which bills still need paying.
            */}
            <Chip
              size="small"
              color={invoice.isPaid ? 'success' : 'warning'}
              label={invoice.isPaid ? 'Đã trả' : 'Chưa trả'}
            />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant="body2" color="text.secondary">
              Phòng {invoice.roomCode} · {formatDate(invoice.issueDate)}
            </Typography>
            <Typography sx={{ fontWeight: 600 }}>{formatMoney(invoice.totalAmount)}</Typography>
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={1.5}>
          {/*
            The meter readings. This is the point of the whole feature: a total
            is what an owner can already read down the telephone, and the
            reading is what a tenant cannot check any other way.
          */}
          {invoice.meterReadingFrom !== null && invoice.meterReadingTo !== null && (
            <Typography variant="body2" color="text.secondary">
              Chỉ số điện: {invoice.meterReadingFrom} → {invoice.meterReadingTo} (
              {invoice.meterReadingTo - invoice.meterReadingFrom} kWh)
            </Typography>
          )}

          <Stack spacing={1} divider={<Divider flexItem />}>
            {invoice.charges.map((charge, index) => {
              const period = formatPeriod(charge.periodStart, charge.periodEnd)
              const basis =
                charge.quantity !== null && charge.unitAmount !== null
                  ? `${charge.quantity} × ${formatMoney(charge.unitAmount)}`
                  : null

              return (
                <Stack key={index} spacing={0.25}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      {/*
                        The same labelling the owner's screens use, so a tenant
                        querying a bill and the owner looking at it read the
                        same words. For a charge the owner wrote themselves,
                        this IS their sentence — which is the informative part,
                        and used to be demoted to the caption below.
                      */}
                      {lineLabel(charge)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMoney(charge.amount)}
                    </Typography>
                  </Stack>
                  {/*
                    The stored description is gone from here: it was the English
                    the system wrote, and the heading above now says the same
                    thing in Vietnamese. What remains is numbers and dates.
                  */}
                  {(basis || period) && (
                    <Typography variant="caption" color="text.secondary">
                      {[basis, period].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Stack>
              )
            })}
          </Stack>

          <Divider />
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 600 }}>Tổng cộng</Typography>
            <Typography sx={{ fontWeight: 600 }}>{formatMoney(invoice.totalAmount)}</Typography>
          </Stack>

          <Box>{children}</Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

export { KIND_LABEL }

interface PayButtonProps {
  onPay: () => void
  pending: boolean
}

export function PayButton({ onPay, pending }: PayButtonProps) {
  return (
    <Button variant="contained" fullWidth onClick={onPay} disabled={pending}>
      {pending ? 'Đang tạo mã…' : 'Thanh toán'}
    </Button>
  )
}
