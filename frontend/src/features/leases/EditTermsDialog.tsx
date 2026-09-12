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
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { errorMessage } from '@/lib/error-messages'
import { useUpdateLease } from '@/features/leases/hooks'
import {
  updateLeaseFormSchema,
  type UpdateLeaseFormOutput,
  type UpdateLeaseFormValues,
} from '@/features/leases/schema'
import type { Lease } from '@/features/leases/types'

interface EditTermsDialogProps {
  open: boolean
  lease: Lease
  onClose: () => void
}

/**
 * What is already recorded, shown so the owner edits rather than retypes.
 *
 * A term the tenancy has no value for opens empty, and an empty field is not
 * sent — see `untouched` in the schema. `reference` is absent on purpose: it is
 * generated and never accepted, so rendering it here even as a disabled input
 * would suggest it is a value that could be changed if something were unlocked.
 */
function defaults(lease: Lease) {
  return {
    durationMonths: lease.durationMonths,
    occupantCount: lease.occupantCount,
    noticeDays: lease.noticeDays ?? undefined,
    paymentDay: lease.paymentDay ?? undefined,
    startWaterReading: lease.startWaterReading ?? undefined,
    // The API reports a date-time; the input takes a date.
    handoverSignedAt: lease.handoverSignedAt?.slice(0, 10) ?? undefined,
  }
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
  } = useForm<UpdateLeaseFormValues, unknown, UpdateLeaseFormOutput>({
    resolver: zodResolver(updateLeaseFormSchema),
    defaultValues: defaults(lease),
  })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset(defaults(lease))
  }, [open, lease, reset])

  async function onSubmit(values: UpdateLeaseFormOutput) {
    setFormError(null)
    try {
      await updateMutation.mutateAsync({ id: lease.id, input: values })
      onClose()
    } catch (error) {
      setFormError(errorMessage(error))
    }
  }

  const isSubmitting = updateMutation.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Sửa điều khoản</DialogTitle>
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
            label="Thời hạn"
            type="number"
            fullWidth
            autoFocus
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            error={Boolean(errors.durationMonths)}
            helperText={
              errors.durationMonths?.message ?? 'Số tháng. Các ngày hiển thị sẽ theo con số này.'
            }
            {...register('durationMonths', { valueAsNumber: true })}
          />
          <TextField
            label="Tính cho"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 1, step: 1 } }}
            error={Boolean(errors.occupantCount)}
            helperText={
              errors.occupantCount?.message ??
              'Số người, dùng tính điện nước. Hoá đơn đã xuất vẫn giữ số người lúc xuất.'
            }
            {...register('occupantCount', { valueAsNumber: true })}
          />

          {/*
            The agreement's own terms. Offered here because the detail screen
            reports them as missing on every tenancy signed before the columns
            existed, and a screen that names a gap without a way to close it is
            a dead end. The API already accepts all four.
          */}
          <Divider />

          <TextField
            label="Báo trước khi kết thúc"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            error={Boolean(errors.noticeDays)}
            helperText={errors.noticeDays?.message ?? 'Số ngày. Để trống nếu chưa thoả thuận.'}
            {...register('noticeDays', { valueAsNumber: true })}
          />
          <TextField
            label="Ngày thanh toán hàng tháng"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 1, max: 31, step: 1 } }}
            error={Boolean(errors.paymentDay)}
            helperText={
              errors.paymentDay?.message ??
              'Ngày trong tháng, từ 1 đến 31. Là ngày hợp đồng ghi, không phụ thuộc tháng dài ngắn.'
            }
            {...register('paymentDay', { valueAsNumber: true })}
          />
          <TextField
            label="Số nước lúc bàn giao"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            error={Boolean(errors.startWaterReading)}
            helperText={
              errors.startWaterReading?.message ?? 'Số đầu kỳ ghi trên đồng hồ khi giao phòng.'
            }
            {...register('startWaterReading', { valueAsNumber: true })}
          />
          <TextField
            label="Ngày ký bàn giao"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.handoverSignedAt)}
            helperText={errors.handoverSignedAt?.message ?? 'Để trống nếu chưa ký.'}
            {...register('handoverSignedAt')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          type="submit"
          form="lease-terms-form"
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
