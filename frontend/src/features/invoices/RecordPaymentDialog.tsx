import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { useLease } from '@/features/leases/hooks'
import { useMarkPaid } from '@/features/invoices/hooks'
import type { Invoice, PaymentMethod } from '@/features/invoices/types'

interface RecordPaymentDialogProps {
  open: boolean
  invoice: Invoice
  onClose: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Recording that a bill has been collected.
 *
 * Reached from the OPEN INVOICE rather than from a row in a list. Marking paid
 * from a list is one click, and one click on a column of adjacent rows with
 * similar rooms and similar amounts is exactly how the wrong bill gets marked
 * paid. Requiring the invoice to be open puts the amount, the tenancy and the
 * period in front of the owner at the moment they confirm.
 *
 * The date is asked for rather than assumed. Money collected on the 3rd and
 * entered on the 10th belongs to the 3rd — the revenue report keys its cash
 * figure on payment dates, and would otherwise put it in the wrong month.
 */
export function RecordPaymentDialog({ open, invoice, onClose }: RecordPaymentDialogProps) {
  const markPaid = useMarkPaid()
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paidAt, setPaidAt] = useState(today())
  const [error, setError] = useState<string | null>(null)

  // The tenancy is fetched for one figure: what is held. Settling from the
  // deposit is refused when the bill is larger than the holding, and offering
  // the choice and then reporting that refusal makes the owner discover a fact
  // the system already knew.
  const leaseQuery = useLease(invoice.leaseId)
  const held = leaseQuery.data?.depositHeld ?? null
  const depositCovers = held !== null && held >= invoice.totalAmount

  useEffect(() => {
    if (!open) return
    setMethod('cash')
    setPaidAt(today())
    setError(null)
  }, [open])

  async function handleConfirm() {
    setError(null)
    try {
      await markPaid.mutateAsync({ id: invoice.id, paymentMethod: method, paidAt })
      onClose()
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Could not record that payment.')
    }
  }

  const isSubmitting = markPaid.isPending
  const blocked = method === 'deposit_deduction' && !depositCovers

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Record payment</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            {formatMoney(invoice.totalAmount)} collected against this bill.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="How it arrived"
            fullWidth
            value={method}
            onChange={(event) => setMethod(event.target.value as PaymentMethod)}
          >
            <MenuItem value="cash">Cash</MenuItem>
            <MenuItem value="bank_transfer">Bank transfer</MenuItem>
            <MenuItem value="deposit_deduction">From the deposit held</MenuItem>
          </TextField>

          {method === 'deposit_deduction' && (
            <Alert severity={depositCovers ? 'info' : 'warning'}>
              <AlertTitle>
                {held === null ? 'Checking the deposit…' : `${formatMoney(held)} held`}
              </AlertTitle>
              {held === null
                ? 'Fetching what this tenancy is holding.'
                : depositCovers
                  ? 'The money reached you when the tenancy began; this records that it has been spent on this bill.'
                  : 'This bill is larger than the deposit held, so it cannot be settled from it.'}
            </Alert>
          )}

          <TextField
            label="Date the money arrived"
            type="date"
            fullWidth
            value={paidAt}
            onChange={(event) => setPaidAt(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Not the date you are entering it — reports are keyed on when it arrived"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || blocked}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Recording…' : 'Record payment'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
