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
import type { PortalInvoice } from '@/features/portal/api'

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
  const hasReadings = invoice.meterReadingFrom !== null && invoice.meterReadingTo !== null

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
            {/*
              When, beside whether. "Đã trả" answers whether, and when is the
              question the portal is opened with after a transfer — without it,
              telling this month's settled bill from last month's means opening
              both.

              Shown only where a date genuinely exists. A settled bill can carry
              none — written off, or settled against a deposit before dates were
              recorded — and the issue date or today would put a day in front of
              the tenant that nothing in the system supports, on the one screen
              they use to check a transfer. The chip alone already says the true
              thing, so nothing is added rather than a gap being named.
            */}
            {invoice.isPaid && invoice.settledAt !== null && (
              <Typography variant="caption" color="text.secondary">
                {/*
                  Labelled, because the card now carries two dates. The row
                  below already ends in the issue date, and two bare dates on
                  one card leave the tenant to guess which is the day their
                  money arrived — the only one of the two they came to check.
                */}
                Trả ngày {formatDate(invoice.settledAt)}
              </Typography>
            )}
          </Stack>
          {/*
            An unpaid bill leads with what is owed, labelled. The amount and the
            state are the reason the link was opened, and reading them used to
            mean taking a colour from one corner and a number from the other.
          */}
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'space-between', alignItems: 'flex-end' }}
          >
            <Typography variant="body2" color="text.secondary">
              {/*
                The building sits with the room, not after the date. Room codes
                repeat across buildings, so a tenant renting in two places has
                two bills a code alone cannot tell apart — and splitting "which
                room, where" around a date separates the two halves of one fact.
              */}
              Phòng {invoice.roomCode} · {invoice.buildingName} ·{' '}
              {formatDate(invoice.issueDate)}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              {!invoice.isPaid && (
                <Typography variant="caption" color="text.secondary" component="div">
                  Tổng cần nộp
                </Typography>
              )}
              <Typography
                sx={{ fontWeight: 700, fontSize: invoice.isPaid ? '1rem' : '1.25rem' }}
                color={invoice.isPaid ? 'text.primary' : 'warning.dark'}
              >
                {formatMoney(invoice.totalAmount)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={1.5}>
          <Typography variant="overline" color="text.secondary">
            Chi tiết các khoản phí
          </Typography>

          <Stack spacing={1.25} divider={<Divider flexItem />}>
            {invoice.charges.map((charge, index) => {
              const period = formatPeriod(charge.periodStart, charge.periodEnd)
              const basis =
                charge.quantity !== null && charge.unitAmount !== null
                  ? `${charge.quantity} × ${formatMoney(charge.unitAmount)}`
                  : null
              // The readings belong under the charge they explain, not floating
              // above the list where the reader has to connect them.
              const readings =
                charge.kind === 'electricity' && hasReadings
                  ? `Chỉ số: ${invoice.meterReadingFrom} → ${invoice.meterReadingTo} (${
                      invoice.meterReadingTo! - invoice.meterReadingFrom!
                    } kWh)`
                  : null

              return (
                <Stack key={index} spacing={0.25}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {/*
                        The same labelling the owner's screens use, so a tenant
                        querying a bill and the owner looking at it read the
                        same words. For a charge the owner wrote themselves,
                        this IS their sentence — which is the informative part,
                        and used to be demoted to the caption below.
                      */}
                      {lineLabel(charge)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatMoney(charge.amount)}
                    </Typography>
                  </Stack>
                  {/*
                    The working, subordinate to the charge rather than beside it:
                    a tenant asks "what am I paying for" before "how was that
                    reached", and on a phone one weight makes the two interleave.

                    Nothing is dropped in the reordering. The quantity, the rate,
                    the period and the readings are what make a bill checkable
                    rather than merely stated, and checkable is the whole point
                    of this screen.
                  */}
                  {[readings, basis, period].filter(Boolean).map((detail) => (
                    <Typography key={detail} variant="caption" color="text.secondary">
                      {detail}
                    </Typography>
                  ))}
                </Stack>
              )
            })}
          </Stack>

          {/*
            Unreachable today, and kept deliberately.

            Every write of a meter reading happens inside `generateInvoice`,
            which builds its lines through `buildLineItems`, which pushes the
            electricity line unconditionally — so a bill with readings always
            has an electricity charge to hang them under. Checked, rather than
            assumed, when this branch could not be exercised.

            It stays because that coupling lives in the billing module and the
            code depending on it lives here. Make the electricity line
            conditional — skipping it at zero consumption is the obvious future
            change — and without this the readings would simply stop appearing,
            with nothing failing to say so.
          */}
          {hasReadings && !invoice.charges.some((charge) => charge.kind === 'electricity') && (
            <Typography variant="caption" color="text.secondary">
              Chỉ số điện: {invoice.meterReadingFrom} → {invoice.meterReadingTo} (
              {invoice.meterReadingTo! - invoice.meterReadingFrom!} kWh)
            </Typography>
          )}

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
