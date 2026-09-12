import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'

import { errorMessage } from '@/lib/error-messages'
import { useUpdateLease } from '@/features/leases/hooks'
import {
  occupantCountFormSchema,
  type OccupantCountFormValues,
} from '@/features/leases/schema'
import type { Lease } from '@/features/leases/types'

interface EditOccupantCountDialogProps {
  open: boolean
  lease: Lease
  onClose: () => void
}

/**
 * The number of people a tenancy is billed water for, and nothing else.
 *
 * Opened from beside the figure, because that is where an owner notices it is
 * wrong. "Chỉnh sửa hợp đồng" edits the same field, but opens on the duration
 * among six fields — arriving to change one number and being handed several is
 * where a correction becomes a change to the wrong number.
 *
 * Sends `occupantCount` alone. Returning the other terms, even unchanged, would
 * make this dialog a writer of values it never showed.
 *
 * Changing it does not touch the people recorded on the tenancy, and does not
 * rewrite invoices already issued — each one kept the count it was issued with.
 */
export function EditOccupantCountDialog({ open, lease, onClose }: EditOccupantCountDialogProps) {
  const updateMutation = useUpdateLease()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OccupantCountFormValues>({
    resolver: zodResolver(occupantCountFormSchema),
    defaultValues: { occupantCount: lease.occupantCount },
  })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset({ occupantCount: lease.occupantCount })
  }, [open, lease, reset])

  async function onSubmit(values: OccupantCountFormValues) {
    setFormError(null)
    try {
      await updateMutation.mutateAsync({
        id: lease.id,
        input: { occupantCount: values.occupantCount },
      })
      onClose()
    } catch (error) {
      // Kept open with what was typed: the owner fixes one number, not retypes it.
      setFormError(errorMessage(error))
    }
  }

  const isSubmitting = updateMutation.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Sửa số người tính tiền</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <form id="occupant-count-form" noValidate onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Tính cho"
            type="number"
            fullWidth
            autoFocus
            margin="dense"
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            error={Boolean(errors.occupantCount)}
            helperText={
              errors.occupantCount?.message ??
              'Số người, dùng tính tiền nước. Hoá đơn đã xuất vẫn giữ số người lúc xuất.'
            }
            {...register('occupantCount', { valueAsNumber: true })}
          />
        </form>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          type="submit"
          form="occupant-count-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang lưu…' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
