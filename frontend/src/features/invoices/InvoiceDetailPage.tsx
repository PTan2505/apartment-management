import { useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import BlockIcon from '@mui/icons-material/Block'
import PaymentsIcon from '@mui/icons-material/Payments'
import UndoIcon from '@mui/icons-material/Undo'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { EmptyState } from '@/components/EmptyState'
import { formatDate } from '@/features/leases/dates'
import { useInvoice, useInvoices, useReversePayment } from '@/features/invoices/hooks'
import {
  invoiceTypeExplanation,
  invoiceTypeLabel,
  monthLabel,
  paymentMethodLabel,
} from '@/features/invoices/labels'
import { lineLabel } from '@/lib/invoice-lines'
import { RecordPaymentDialog } from '@/features/invoices/RecordPaymentDialog'
import { VoidInvoiceDialog } from '@/features/invoices/VoidInvoiceDialog'
import type { Invoice, InvoiceLineItem, Payment } from '@/features/invoices/types'

/**
 * What a charge was computed from — 50 kWh at 3.500, two occupants at 100.000.
 *
 * Absent where there is no basis, and rendered as nothing rather than as a dash
 * or a quantity of 1: an owner-named charge IS the judgement, and a fabricated
 * basis beside it would read as information without being any.
 */
function basisLabel(line: InvoiceLineItem): string {
  if (line.quantity === null && line.unitAmount === null) return ''
  if (line.quantity === null) return formatMoney(line.unitAmount)
  return `${line.quantity} × ${formatMoney(line.unitAmount)}`
}

/** The days a charge covers, where it covers any. */
function periodLabel(line: InvoiceLineItem): string {
  if (line.periodStart === null || line.periodEnd === null) return ''
  return `${formatDate(line.periodStart)} – ${formatDate(line.periodEnd)}`
}

/**
 * The charges, individually.
 *
 * A tenant querying their bill asks about one line of it, never the total, and
 * an owner who can see only the total cannot answer them. Each rate and count
 * was copied onto its line when the invoice was issued, so this shows what was
 * actually charged rather than what the same calculation would produce today.
 */
function ChargesCard({ invoice }: { invoice: Invoice }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Các khoản
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Khoản mục</TableCell>
                <TableCell>Tính theo</TableCell>
                <TableCell>Thời gian</TableCell>
                <TableCell align="right">Số tiền</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.lineItems.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Typography variant="body2">{lineLabel(line)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {basisLabel(line)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {periodLabel(line)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">{formatMoney(line.amount)}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Tổng cộng
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatMoney(invoice.totalAmount)}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

/**
 * What settled this bill, and what was undone.
 *
 * Both are shown. Reversing a payment returns the invoice to unpaid; it does
 * not erase the fact that money was once recorded as received, and an owner
 * reconciling with a tenant needs to see both halves.
 */
function PaymentsCard({
  invoice,
  onReverse,
  reversing,
}: {
  invoice: Invoice
  onReverse: (payment: Payment) => void
  reversing: number | null
}) {
  const real = invoice.payments.filter(
    (payment) => payment.state === 'succeeded' || payment.state === 'reversed',
  )

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>
          Thanh toán
        </Typography>

        {real.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Chưa ghi nhận khoản thanh toán nào cho hoá đơn này.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {real.map((payment) => (
              <Box
                key={payment.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography variant="body2">
                    {formatMoney(payment.amount)} · {paymentMethodLabel(payment.method)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {payment.state === 'reversed'
                      ? `Nhận ${formatDate(payment.paidAt)}, đảo ${formatDate(payment.reversedAt)}`
                      : `Nhận ${formatDate(payment.paidAt)}`}
                  </Typography>
                </Box>
                {payment.state === 'reversed' ? (
                  <Chip size="small" label="Đã đảo" />
                ) : (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<UndoIcon />}
                    disabled={reversing === payment.id}
                    onClick={() => onReverse(payment)}
                  >
                    {reversing === payment.id ? 'Đang đảo…' : 'Đảo giao dịch'}
                  </Button>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}

export function InvoiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const invoiceQuery = useInvoice(Number(id))
  const reverse = useReversePayment()

  // Derived before the early returns below, because hooks cannot be called
  // conditionally and the query that follows depends on these.
  const loaded = invoiceQuery.data
  const covered = loaded?.year != null && loaded?.month != null

  /**
   * Whether a replacement already exists for that lease and month.
   *
   * Asked so the withdrawn banner does not assert something false. Without it,
   * a bill voided and reissued last month would still say its tenancy "is back
   * on the list", and the owner following that link would find nothing there.
   */
  const replacements = useInvoices(
    { leaseId: loaded?.leaseId ?? 0, year: loaded?.year ?? undefined, month: loaded?.month ?? undefined },
    // Only where there is something to ask about: a bill covering no month is
    // on no billing list, so the question does not arise.
    loaded !== undefined && covered && loaded.voidedAt !== null,
  )

  const [payOpen, setPayOpen] = useState(false)
  const [voidOpen, setVoidOpen] = useState(false)
  const [reversing, setReversing] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (invoiceQuery.isPending) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (invoiceQuery.error) {
    if (isApiError(invoiceQuery.error) && invoiceQuery.error.isNotFound) {
      return (
        <EmptyState
          title="Không tìm thấy hoá đơn"
          description="Có thể nó đã bị xoá, hoặc địa chỉ sai."
          action={
            <Button variant="outlined" onClick={() => void navigate('/invoices')}>
              Về danh sách hoá đơn
            </Button>
          }
        />
      )
    }
    return (
      <Alert
        severity={
          isApiError(invoiceQuery.error) && invoiceQuery.error.isTransport ? 'warning' : 'error'
        }
        action={
          <Button color="inherit" size="small" onClick={() => void invoiceQuery.refetch()}>
            Thử lại
          </Button>
        }
      >
        <AlertTitle>Không tải được hoá đơn này</AlertTitle>
        {isApiError(invoiceQuery.error)
          ? invoiceQuery.error.message
          : 'An unexpected error occurred.'}
      </Alert>
    )
  }

  const invoice = invoiceQuery.data
  const isVoided = invoice.voidedAt !== null
  const period = covered
    ? monthLabel(invoice.year, invoice.month)
    : `Xuất ${formatDate(invoice.issueDate)}`

  /**
   * Where reissuing happens — the billing list for the month this bill covered,
   * NOT the current month, which is a different month's work.
   *
   * Null for a bill covering no month. A move-in or ad-hoc invoice is not on
   * any billing list, and sending an owner to one would land them on a screen
   * that does not mention their room.
   */
  const billingRunPath = covered
    ? `/invoices/billing-run?year=${invoice.year}&month=${invoice.month}`
    : null

  const alreadyReissued =
    covered && (replacements.data?.data ?? []).some((other) => other.id !== invoice.id)

  async function handleReverse(payment: Payment) {
    setActionError(null)
    setReversing(payment.id)
    try {
      await reverse.mutateAsync({
        paymentId: payment.id,
        // Reversed today, which is when the money actually goes back. Its own
        // date rather than the payment's: money taken in March and returned in
        // April happened in both months.
        reversedAt: new Date().toISOString().slice(0, 10),
      })
    } catch (cause) {
      setActionError(isApiError(cause) ? cause.message : 'Không đảo được giao dịch đó.')
    } finally {
      setReversing(null)
    }
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component={RouterLink} to="/invoices" underline="hover" color="inherit">
          Hoá đơn
        </Link>
        <Typography color="text.primary">{period}</Typography>
      </Breadcrumbs>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" component="h2">
            {formatMoney(invoice.totalAmount)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {period} ·{' '}
            <Link component={RouterLink} to={`/leases/${invoice.leaseId}`} underline="hover">
              Hợp đồng #{invoice.leaseId}
            </Link>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip variant="outlined" label={invoiceTypeLabel(invoice.type)} />
          {isVoided ? (
            <Chip label="Đã rút" />
          ) : (
            <Chip
              color={invoice.paymentStatus === 'paid' ? 'success' : 'warning'}
              variant={invoice.paymentStatus === 'paid' ? 'filled' : 'outlined'}
              label={invoice.paymentStatus === 'paid' ? 'Đã trả' : 'Chưa trả'}
            />
          )}
        </Stack>
      </Box>

      {/*
        What kind of bill this is, said in a sentence. The monthly one is the
        reason: it settles one month's utilities alongside the NEXT month's
        rent, so it names two months and reads like an error until somebody
        explains it once.
      */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Hoá đơn {invoiceTypeLabel(invoice.type)}</AlertTitle>
        {invoiceTypeExplanation(invoice.type)}
      </Alert>

      {isVoided && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          // Offered only where a billing list actually covers this bill, and
          // only while nothing has replaced it. A move-in or ad-hoc invoice
          // belongs to no month, and no list will ever offer it — see below.
          action={
            billingRunPath && !alreadyReissued ? (
              <Button
                color="inherit"
                size="small"
                component={RouterLink}
                to={billingRunPath}
              >
                Tới đó
              </Button>
            ) : undefined
          }
        >
          <AlertTitle>Hoá đơn này đã bị rút</AlertTitle>
          {/*
            The reason, where there is one. Null means the bill was voided
            before reasons were recorded — a real state, said as such rather
            than papered over with a substituted explanation nobody gave.
          */}
          {invoice.voidReason ? (
            <>
              {invoice.voidReason}
              <br />
            </>
          ) : (
            <>
              Không ghi nhận lý do — hoá đơn này bị rút từ trước khi hệ thống lưu lý do.
              <br />
            </>
          )}
          Rút ngày {formatDate(invoice.voidedAt)}. Vẫn được giữ làm bằng chứng đã thu
          những khoản gì, và không tính vào bất kỳ con số nào.
          {/*
            Withdrawing is almost never the goal — the owner is correcting a
            bill, and stopping at "withdrawn" leaves them mid-task with no sign
            of where the other half happens.
          */}
          {billingRunPath && !alreadyReissued && (
            <>
              <br />
              Hợp đồng này đã quay lại danh sách cần xuất của {period}, có thể xuất lại ở đó.
            </>
          )}
          {billingRunPath && alreadyReissued && (
            <>
              <br />
              Đã có hoá đơn thay thế cho {period}.
            </>
          )}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}

      <Stack spacing={2}>
        <ChargesCard invoice={invoice} />

        {invoice.previousElectricityUse !== null && invoice.currentElectricityUse !== null && (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Công tơ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.previousElectricityUse} → {invoice.currentElectricityUse} ·{' '}
                tính {invoice.currentElectricityUse - invoice.previousElectricityUse} kWh
              </Typography>
            </CardContent>
          </Card>
        )}

        <PaymentsCard invoice={invoice} onReverse={handleReverse} reversing={reversing} />

        {/*
          Withheld on a voided bill and on one already settled, rather than
          offered and refused: the API answers 409 for both, and a control that
          cannot work is worse than no control.
        */}
        {!isVoided && invoice.paymentStatus === 'pending' && (
          <Box>
            <Divider sx={{ mb: 2 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<PaymentsIcon />}
                onClick={() => setPayOpen(true)}
              >
                Ghi nhận thanh toán
              </Button>
              {/*
                Đường sửa cho một hoá đơn xuất nhầm — most often a
                mistyped meter reading, which no check on the billing screen can
                catch once it is above the opening reading.
              */}
              <Button
                variant="outlined"
                color="error"
                startIcon={<BlockIcon />}
                onClick={() => setVoidOpen(true)}
              >
                Rút hoá đơn
              </Button>
            </Stack>
          </Box>
        )}

        {/*
          Withheld on a PAID bill, with the step before it named.

          The API refuses this outright — withdrawing a bill while the money
          paid for it stays put leaves an owner holding cash against nothing.
          Offering it to report that refusal teaches nothing actionable; the
          thing the owner needs is the reversal, which is on this same screen.
        */}
        {!isVoided && invoice.paymentStatus === 'paid' && (
          <Alert severity="info">
            <AlertTitle>Muốn rút hoá đơn này thì phải đảo giao dịch trước</AlertTitle>
            Hoá đơn đã thanh toán thì không rút được — số tiền đã trả sẽ không còn gắn
            với khoản nào. Đảo giao dịch ở trên trước, rồi mới rút được.
          </Alert>
        )}
      </Stack>

      <RecordPaymentDialog
        open={payOpen}
        invoice={invoice}
        onClose={() => setPayOpen(false)}
      />
      <VoidInvoiceDialog
        open={voidOpen}
        invoice={invoice}
        onClose={() => setVoidOpen(false)}
      />
    </Box>
  )
}
