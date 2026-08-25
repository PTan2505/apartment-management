import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
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
import { useTransferPrimary } from '@/features/leases/hooks'
import type { Occupant } from '@/features/leases/types'

interface TransferPrimaryDialogProps {
  open: boolean
  leaseId: number
  currentOccupants: Occupant[]
  onClose: () => void
}

/**
 * Passing responsibility for the agreement, without anybody leaving.
 *
 * Distinct from the transfer inside a departure: this is the case where the
 * people are unchanged and only who answers for the tenancy has moved — a
 * couple where the other partner now deals with the owner, say. The previous
 * holder stays a current occupant, and the record of who held it before is
 * kept.
 */
export function TransferPrimaryDialog({
  open,
  leaseId,
  currentOccupants,
  onClose,
}: TransferPrimaryDialogProps) {
  const transferMutation = useTransferPrimary()
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  // Only a current occupant can take it on; the API rejects anyone else with a
  // 400, and not offering them beats explaining the rejection.
  const candidates = currentOccupants.filter((occupant) => !occupant.isPrimary)
  const holder = currentOccupants.find((occupant) => occupant.isPrimary)

  useEffect(() => {
    if (!open) return
    setCustomerId('')
    setError(null)
  }, [open])

  async function handleTransfer() {
    if (customerId === '') return
    setError(null)
    try {
      await transferMutation.mutateAsync({ leaseId, customerId: Number(customerId) })
      onClose()
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Không chuyển được người đứng tên.')
    }
  }

  const isSubmitting = transferMutation.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Chuyển người đứng tên</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            {holder?.fullName ?? 'The current holder'} answers for this agreement
            kể từ hôm nay. Họ vẫn ở đây; chỉ đổi người đứng tên.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Người nhận"
            fullWidth
            value={customerId === '' ? '' : String(customerId)}
            onChange={(event) => setCustomerId(Number(event.target.value))}
            helperText="Chỉ những người đang ở tại đây"
          >
            {candidates.map((candidate) => (
              <MenuItem key={candidate.id} value={String(candidate.customerId)}>
                {candidate.fullName ?? `Customer #${candidate.customerId}`}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleTransfer()}
          disabled={isSubmitting || customerId === ''}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Transferring…' : 'Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
