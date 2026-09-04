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

import { errorMessage } from '@/lib/error-messages'
import { useCustomers } from '@/features/customers/hooks'
import { useAddOccupant } from '@/features/leases/hooks'

interface AddOccupantDialogProps {
  open: boolean
  leaseId: number
  onClose: () => void
}

/**
 * Adding somebody to a tenancy.
 *
 * Every customer is offered, not only those on no lease. Somebody may
 * legitimately be recorded on more than one — and somebody who previously left
 * THIS tenancy can be added again, which creates a fresh record and leaves the
 * earlier one intact. Filtering the list here would hide the second case while
 * only guessing at the first.
 *
 * Adding a person who is already a current occupant is refused by the API with
 * a message saying so, which is more useful than anything this form could
 * invent.
 */
export function AddOccupantDialog({ open, leaseId, onClose }: AddOccupantDialogProps) {
  const addMutation = useAddOccupant()
  const customersQuery = useCustomers({ pageSize: 200 })
  const [customerId, setCustomerId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCustomerId('')
    setError(null)
  }, [open])

  async function handleAdd() {
    if (customerId === '') return
    setError(null)
    try {
      await addMutation.mutateAsync({ leaseId, customerId: Number(customerId) })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  const isSubmitting = addMutation.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thêm người</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            Ghi nhận người này đang ở đây. Không làm thay đổi số người
            dùng để tính tiền phòng.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Người"
            fullWidth
            value={customerId === '' ? '' : String(customerId)}
            onChange={(event) => setCustomerId(Number(event.target.value))}
          >
            {(customersQuery.data?.data ?? []).map((customer) => (
              <MenuItem key={customer.id} value={String(customer.id)}>
                {customer.fullName}
                {customer.phone ? ` · ${customer.phone}` : ''}
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
          onClick={() => void handleAdd()}
          disabled={isSubmitting || customerId === ''}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Adding…' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
