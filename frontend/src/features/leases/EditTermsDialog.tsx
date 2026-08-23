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
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { isApiError } from '@/lib/api-error'
import { useUpdateLease } from '@/features/leases/hooks'
import { updateLeaseFormSchema, type UpdateLeaseFormOutput } from '@/features/leases/schema'
import type { Lease } from '@/features/leases/types'

interface EditTermsDialogProps {
  open: boolean
  lease: Lease
  onClose: () => void
}

/**
 * The two terms the API allows changing on a running tenancy.
 *
 * Not the rent, the start date, the deposit or the room: those were agreed when
 * the tenancy was signed, and money already charged was computed from them.
 * Offering a control that cannot do anything is worse than not offering it.
 *
 * A tenancy that has recorded a move-out cannot be edited at all — the screen
 * withholds the action rather than presenting it and reporting the refusal.
 */
export function EditTermsDialog({ open, lease, onClose }: EditTermsDialogProps) {
  const updateMutation = useUpdateLease()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateLeaseFormOutput>({
    resolver: zodResolver(updateLeaseFormSchema),
    defaultValues: {
      durationMonths: lease.durationMonths,
      occupantCount: lease.occupantCount,
    },
  })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset({ durationMonths: lease.durationMonths, occupantCount: lease.occupantCount })
  }, [open, lease, reset])

  async function onSubmit(values: UpdateLeaseFormOutput) {
    setFormError(null)
    try {
      await updateMutation.mutateAsync({ id: lease.id, input: values })
      onClose()
    } catch (error) {
      setFormError(isApiError(error) ? error.message : 'Could not save those changes.')
    }
  }

  const isSubmitting = updateMutation.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit terms</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Stack
          spacing={2}
          component="form"
          id="lease-terms-form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1 }}
        >
          <TextField
            label="Duration"
            type="number"
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            error={Boolean(errors.durationMonths)}
            helperText={
              errors.durationMonths?.message ?? 'Months. The dates shown follow this.'
            }
            {...register('durationMonths', { valueAsNumber: true })}
          />
          <TextField
            label="Bill for"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            error={Boolean(errors.occupantCount)}
            helperText={
              errors.occupantCount?.message ??
              'People, for utilities. Bills already issued keep the count they were billed at.'
            }
            {...register('occupantCount', { valueAsNumber: true })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="lease-terms-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
