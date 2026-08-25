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
import PaymentsIcon from '@mui/icons-material/Payments'
import UndoIcon from '@mui/icons-material/Undo'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { EmptyState } from '@/components/EmptyState'
import { formatDate } from '@/features/leases/dates'
import { useInvoice, useReversePayment } from '@/features/invoices/hooks'
import {
  invoiceTypeExplanation,
  invoiceTypeLabel,
  monthLabel,
  paymentMethodLabel,
} from '@/features/invoices/labels'
import { RecordPaymentDialog } from '@/features/invoices/RecordPaymentDialog'
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
          Charges
        </Typography>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>What</TableCell>
                <TableCell>Based on</TableCell>
                <TableCell>Covers</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.lineItems.map((line) => (
                <TableRow key={line.id}>
                  <TableCell>
                    <Typography variant="body2">{line.description}</Typography>
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
                    Total
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
          Payments
        </Typography>

        {real.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nothing has been recorded against this bill.
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
                      ? `Received ${formatDate(payment.paidAt)}, reversed ${formatDate(payment.reversedAt)}`
                      : `Received ${formatDate(payment.paidAt)}`}
                  </Typography>
                </Box>
                {payment.state === 'reversed' ? (
                  <Chip size="small" label="Reversed" />
                ) : (
                  <Button
                    size="small"
                    color="warning"
                    startIcon={<UndoIcon />}
                    disabled={reversing === payment.id}
                    onClick={() => onReverse(payment)}
                  >
                    {reversing === payment.id ? 'Reversing…' : 'Reverse'}
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
  const [payOpen, setPayOpen] = useState(false)
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
          title="Invoice not found"
          description="It may have been removed, or the address may be wrong."
          action={
            <Button variant="outlined" onClick={() => void navigate('/invoices')}>
              Back to invoices
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
            Retry
          </Button>
        }
      >
        <AlertTitle>Could not load this invoice</AlertTitle>
        {isApiError(invoiceQuery.error)
          ? invoiceQuery.error.message
          : 'An unexpected error occurred.'}
      </Alert>
    )
  }

  const invoice = invoiceQuery.data
  const isVoided = invoice.voidedAt !== null
  const period =
    invoice.year !== null && invoice.month !== null
      ? monthLabel(invoice.year, invoice.month)
      : `Issued ${formatDate(invoice.issueDate)}`

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
      setActionError(isApiError(cause) ? cause.message : 'Could not reverse that payment.')
    } finally {
      setReversing(null)
    }
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link component={RouterLink} to="/invoices" underline="hover" color="inherit">
          Invoices
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
              Lease #{invoice.leaseId}
            </Link>
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip variant="outlined" label={invoiceTypeLabel(invoice.type)} />
          {isVoided ? (
            <Chip label="Voided" />
          ) : (
            <Chip
              color={invoice.paymentStatus === 'paid' ? 'success' : 'warning'}
              variant={invoice.paymentStatus === 'paid' ? 'filled' : 'outlined'}
              label={invoice.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
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
        <AlertTitle>{invoiceTypeLabel(invoice.type)} invoice</AlertTitle>
        {invoiceTypeExplanation(invoice.type)}
      </Alert>

      {isVoided && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>This bill was withdrawn</AlertTitle>
          Voided on {formatDate(invoice.voidedAt)}. It is kept as a record of what
          was charged, and counts towards nothing.
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
                Meter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.previousElectricityUse} → {invoice.currentElectricityUse} ·{' '}
                {invoice.currentElectricityUse - invoice.previousElectricityUse} kWh billed
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
            <Button
              variant="contained"
              startIcon={<PaymentsIcon />}
              onClick={() => setPayOpen(true)}
            >
              Record payment
            </Button>
          </Box>
        )}
      </Stack>

      <RecordPaymentDialog
        open={payOpen}
        invoice={invoice}
        onClose={() => setPayOpen(false)}
      />
    </Box>
  )
}
