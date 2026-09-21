import type { ReactNode } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'

interface ConfirmDialogProps {
  open: boolean
  /** The question itself. Names the thing being acted on. */
  title: string
  /** What will happen, in the owner's terms. */
  description?: ReactNode
  /** Names the action — "Hoàn tiền", "Xoá", "Khôi phục" — never "OK". */
  confirmLabel: string
  /** Shown on the confirm button while the request is in flight. */
  busyLabel?: string
  /** Red for anything that destroys or moves money. */
  destructive?: boolean
  busy?: boolean
  /** A refusal, reported here rather than behind the dialog. */
  error?: string | null
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}

/**
 * The question asked before an action that cannot be taken back.
 *
 * ── What this is for, and what it is not for ────────────────────────────────
 *
 * Money moved, a file deleted or overwritten, something put in or out of
 * service, a recorded figure changed. NOT for creating things or for editing
 * details that carry no money: an owner who meets the same dialog fifteen times
 * an hour stops reading it, and then it is not protecting the one case that
 * mattered.
 *
 * Which is also why `title` and `description` are separate and both are the
 * caller's words. A dialog that only asks whether you are sure tells the owner
 * nothing they did not know when they clicked, and is dismissed unread. The
 * ones here name an amount, a file, or what a new rate will apply to.
 *
 * The older hand-written confirmations — settling a deposit, closing a meter —
 * are deliberately not rebuilt on this. They carry real content of their own,
 * and a generic shell would make them worse.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  destructive = false,
  busy = false,
  error,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      // Not dismissible while the request is in flight: closing here would
      // leave the owner watching a screen that is still changing.
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {description && <DialogContentText component="div">{description}</DialogContentText>}
          {children}
          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          onClick={onConfirm}
          // One action, once: the actions guarded here are exactly the ones
          // where sending twice is not harmless.
          disabled={busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {busy ? (busyLabel ?? 'Đang xử lý…') : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
