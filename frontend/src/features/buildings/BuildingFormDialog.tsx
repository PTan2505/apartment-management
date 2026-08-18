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
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { isApiError } from '@/lib/api-error'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import {
  buildingFormSchema,
  type BuildingFormOutput,
  type BuildingFormValues,
} from '@/features/buildings/schema'
import { useCreateBuilding, useUpdateBuilding } from '@/features/buildings/hooks'
import type { Building } from '@/features/buildings/types'

interface BuildingFormDialogProps {
  open: boolean
  /** The building being edited, or null to create a new one. */
  building: Building | null
  onClose: () => void
  /** Called after a create (not an edit) so the list can reveal the new row. */
  onCreated?: () => void
}

const EMPTY: BuildingFormValues = {
  displayName: '',
  address: '',
  ward: '',
  city: '',
  country: 'Vietnam',
  electricityRate: 0,
  waterRatePerPerson: 0,
}

export function BuildingFormDialog({
  open,
  building,
  onClose,
  onCreated,
}: BuildingFormDialogProps) {
  const theme = useTheme()
  // Unlike the shell's drawers, a dialog is not painted until it opens, so a
  // first-render false here cannot flash the wrong layout.
  const fullScreen = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT))

  const createMutation = useCreateBuilding()
  const updateMutation = useUpdateBuilding()
  const [formError, setFormError] = useState<string | null>(null)

  const isEdit = building !== null
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<BuildingFormValues>({
    resolver: zodResolver(buildingFormSchema),
    defaultValues: EMPTY,
  })

  // Refill whenever the dialog opens, so editing one building then another does
  // not show the previous one's values.
  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset(
      building
        ? {
            displayName: building.displayName,
            address: building.address,
            ward: building.ward,
            city: building.city,
            country: building.country,
            electricityRate: building.electricityRate,
            waterRatePerPerson: building.waterRatePerPerson,
          }
        : EMPTY,
    )
  }, [open, building, reset])

  async function onSubmit(values: BuildingFormValues) {
    setFormError(null)
    const input = buildingFormSchema.parse(values) satisfies BuildingFormOutput
    try {
      if (building) {
        await updateMutation.mutateAsync({ id: building.id, input })
      } else {
        await createMutation.mutateAsync(input)
        onCreated?.()
      }
      onClose()
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Something went wrong. Please try again.')
        return
      }
      // The API names the fields it rejected; attribute them rather than
      // showing one opaque message above a form the user must now re-read.
      const fieldErrors = error.fieldErrors
      let attributed = false
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (field in EMPTY && messages[0]) {
          setError(field as keyof BuildingFormValues, {
            type: 'server',
            message: messages[0],
          })
          attributed = true
        }
      }
      if (!attributed) setFormError(error.message)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{isEdit ? 'Edit building' : 'New building'}</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Stack spacing={2} component="form" id="building-form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            fullWidth
            autoFocus
            error={Boolean(errors.displayName)}
            helperText={errors.displayName?.message}
            {...register('displayName')}
          />
          <TextField
            label="Street address"
            fullWidth
            helperText={errors.address?.message ?? 'House number and street only'}
            error={Boolean(errors.address)}
            {...register('address')}
          />
          <TextField
            label="Ward"
            fullWidth
            error={Boolean(errors.ward)}
            helperText={errors.ward?.message}
            {...register('ward')}
          />
          <TextField
            label="City"
            fullWidth
            error={Boolean(errors.city)}
            helperText={errors.city?.message}
            {...register('city')}
          />
          <TextField
            label="Country"
            fullWidth
            error={Boolean(errors.country)}
            helperText={errors.country?.message}
            {...register('country')}
          />
          <TextField
            label="Electricity rate"
            type="number"
            fullWidth
            // `any` allows the fractional rates the API records.
            slotProps={{ htmlInput: { step: 'any', min: 0 } }}
            error={Boolean(errors.electricityRate)}
            helperText={errors.electricityRate?.message ?? 'Đồng per kWh'}
            {...register('electricityRate', { valueAsNumber: true })}
          />
          <TextField
            label="Water rate"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { step: 'any', min: 0 } }}
            error={Boolean(errors.waterRatePerPerson)}
            helperText={errors.waterRatePerPerson?.message ?? 'Đồng per person per month'}
            {...register('waterRatePerPerson', { valueAsNumber: true })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="building-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Saving…' : isEdit ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
