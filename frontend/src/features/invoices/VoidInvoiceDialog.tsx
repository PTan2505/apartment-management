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
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { useVoidInvoice } from '@/features/invoices/hooks'
import { monthLabel } from '@/features/invoices/labels'
import type { Invoice } from '@/features/invoices/types'

interface VoidInvoiceDialogProps {
  open: boolean
  invoice: Invoice
  onClose: () => void
}

/**
 * Withdrawing a bill issued in error.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 *
 * The billing screen asks for a meter reading for every occupied room in a
 * building, one after another, and the only check available there is that a
 * reading is not BELOW the one it opens from. A reading of 280 where the meter
 * says 260 passes every check and bills the tenant for twenty units they did
 * not use. Without this, that bill cannot be corrected or withdrawn from
 * anywhere in the application.
 *
 * ── Why the reason is required ─────────────────────────────────────────────
 *
 * A misread meter, a bill against the wrong tenancy, and a charge waived after
 * a conversation are different events, and a withdrawn bill carrying only a
 * date cannot be explained months later — least of all to the tenant asking
 * about it. Optional would mean always empty, which is the same as absent.
 *
 * Free text rather than a fixed list: the mistakes are too varied for a list
 * short enough to read, and a short one pushes everything into "other".
 */
export function VoidInvoiceDialog({ open, invoice, onClose }: VoidInvoiceDialogProps) {
  const voidInvoice = useVoidInvoice()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReason('')
    setError(null)
  }, [open])

  async function handleConfirm() {
    setError(null)
    try {
      await voidInvoice.mutateAsync({ id: invoice.id, reason: reason.trim() })
      onClose()
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Không rút được hoá đơn này.')
    }
  }

  const isSubmitting = voidInvoice.isPending
  const period =
    invoice.year !== null && invoice.month !== null
      ? monthLabel(invoice.year, invoice.month)
      : null

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Rút hoá đơn này</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            {formatMoney(invoice.totalAmount)}
            {period ? ` for ${period}` : ''} sẽ không còn được tính vào khoản phải thu.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          {/*
            Said explicitly because both misreadings cause harm: an owner who
            believes they are erasing a record hesitates over something safe,
            and one who believes they are not erasing it when they are has been
            misled about what they just did.
          */}
          <Alert severity="info">
            <AlertTitle>Hoá đơn được GIỮ LẠI, không bị xoá</AlertTitle>
            Vẫn nằm trong hồ sơ như bằng chứng đã thu khoản gì, đánh dấu là đã rút.
            {period ? ` Hợp đồng sẽ quay lại danh sách cần xuất của ${period}, có thể xuất lại ở đó.` : ''}
          </Alert>

          <TextField
            label="Vì sao rút hoá đơn này?"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
            helperText="Vài tháng sau sẽ có người đọc lại khi thắc mắc về hoá đơn này — kể cả khách"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Giữ hoá đơn
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => void handleConfirm()}
          // Blocked on an empty or whitespace-only reason, so the requirement is
          // met before the API has to refuse it.
          disabled={isSubmitting || reason.trim() === ''}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang rút…' : 'Rút hoá đơn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
