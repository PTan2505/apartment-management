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

import { ChangedAmounts, changed, type AmountChange } from '@/components/ChangedAmounts'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoneyField } from '@/components/MoneyField'
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
    electricityRate: lease.electricityRate,
    waterRatePerPerson: lease.waterRatePerPerson,
    // The API reports a date-time; the input takes a date.
    handoverSignedAt: lease.handoverSignedAt?.slice(0, 10) ?? undefined,
  }
}

/**
 * The terms the API allows changing on a running tenancy.
 *
 * Not the rent, the start date, the deposit or the room: those were agreed when
 * the tenancy was signed, and money already charged was computed from them.
 * Offering a control that cannot do anything is worse than not offering it.
 *
 * The utility rates ARE here. A tenancy is billed at its own copies, so without
 * this the only way to bring a running tenancy onto a new rate would be to
 * renew it early. Changing them moves what is billed from now on; invoices
 * already issued keep the rates recorded on their own line items.
 *
 * A tenancy that has recorded a move-out cannot be edited at all — the screen
 * withholds the action rather than presenting it and reporting the refusal.
 */
export function EditTermsDialog({ open, lease, onClose }: EditTermsDialogProps) {
  const updateMutation = useUpdateLease()
  const [formError, setFormError] = useState<string | null>(null)
  /** A save held while the owner is shown which rates it moves. */
  const [pending, setPending] = useState<{
    values: UpdateLeaseFormOutput
    changes: AmountChange[]
  } | null>(null)

  const {
    register,
    control,
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
    // This is the one place a running tenancy's rates can move, so it is the
    // one place worth asking. The other terms here change nothing already billed.
    const doi = changed([
      { label: 'Giá điện', before: lease.electricityRate, after: values.electricityRate },
      { label: 'Giá nước', before: lease.waterRatePerPerson, after: values.waterRatePerPerson },
    ])
    if (doi.length > 0) {
      setFormError(null)
      setPending({ values, changes: doi })
      return
    }
    await send(values)
  }

  async function send(values: UpdateLeaseFormOutput) {
    setFormError(null)
    try {
      await updateMutation.mutateAsync({ id: lease.id, input: values })
      setPending(null)
      onClose()
    } catch (error) {
      // The confirmation steps aside so the form's own report is what the owner
      // is looking at.
      setPending(null)
      setFormError(errorMessage(error))
    }
  }

  const isSubmitting = updateMutation.isPending

  return (
    <>
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
              'Số người, dùng tính tiền nước. Hoá đơn đã xuất vẫn giữ số người lúc xuất.'
            }
            {...register('occupantCount', { valueAsNumber: true })}
          />

          <MoneyField
            control={control}
            name="electricityRate"
            label="Giá điện"
            unit="đ / kWh"
            decimals
            helperText="Giá của riêng hợp đồng này. Hoá đơn đã xuất giữ giá lúc xuất."
          />
          <MoneyField
            control={control}
            name="waterRatePerPerson"
            label="Giá nước"
            unit="đ / người / tháng"
            decimals
            helperText="Đổi giá ở đây không đụng tới toà nhà hay hợp đồng khác."
          />

          {/*
            The agreement's own term. Offered here as well as on the signing
            form, because a tenancy recorded from an old paper file gets its
            date later or not at all.

            Three fields used to sit here — notice period, payment day, opening
            water reading. They are gone from the system: each was stored and
            read by nothing.
          */}
          <Divider />

          <TextField
            label="Ngày ký hợp đồng"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.handoverSignedAt)}
            helperText={
              errors.handoverSignedAt?.message ?? 'Ngày ký hợp đồng giấy với khách. Để trống nếu chưa ký.'
            }
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

      <ConfirmDialog
        open={pending !== null}
        title="Lưu giá mới cho hợp đồng này?"
        description="Giá mới tính từ hoá đơn tiếp theo. Hoá đơn đã xuất giữ nguyên giá đã ghi trên chính nó, và toà nhà không bị đổi theo."
        confirmLabel="Lưu giá mới"
        busyLabel="Đang lưu…"
        busy={isSubmitting}
        onConfirm={() => {
          if (pending) void send(pending.values)
        }}
        onClose={() => setPending(null)}
      >
        {pending && <ChangedAmounts entries={pending.changes} />}
      </ConfirmDialog>
    </>
  )
}
