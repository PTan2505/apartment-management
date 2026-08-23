import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { isApiError } from '@/lib/api-error'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useBuildings } from '@/features/buildings/hooks'
import { useCustomers } from '@/features/customers/hooks'
import { useRoomMeterReading, useRooms } from '@/features/rooms/hooks'
import { useCreateLease } from '@/features/leases/hooks'
import { createLeaseFormSchema, type CreateLeaseFormValues } from '@/features/leases/schema'
import type { Lease } from '@/features/leases/types'

interface LeaseFormDialogProps {
  open: boolean
  /** Fixes the room when signing from a room's own screen; omit to choose. */
  roomId?: number
  onClose: () => void
  onCreated: (lease: Lease) => void
}

/** Today, as the date input wants it. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Signing a tenancy.
 *
 * The same form whichever way it is reached: from the leases screen, where a
 * room is chosen, and from a vacant room, where it arrives already chosen. An
 * owner thinks in rooms and a ledger thinks in tenancies; both routes are how
 * the work actually arrives, and two forms would be two things to keep in step.
 */
export function LeaseFormDialog({ open, roomId, onClose, onCreated }: LeaseFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT))

  const createMutation = useCreateLease()
  const [formError, setFormError] = useState<string | null>(null)
  const isSubmitting = createMutation.isPending

  /**
   * Only rooms that can be let.
   *
   * Read from what the API reports about a room rather than assembled from
   * tenancies here. A room that is already let cannot take a second tenancy,
   * and offering it would mean explaining a refusal instead of preventing one.
   */
  /**
   * Narrows the rooms offered. Not part of what is submitted — a lease is
   * created against a room, and the room already knows its building.
   *
   * It exists because a room code identifies a room only within its building:
   * a flat list of every vacant room across every building is both long and
   * ambiguous, with the same code appearing more than once.
   */
  const [pickerBuildingId, setPickerBuildingId] = useState<number | ''>('')

  const roomsQuery = useRooms({
    pageSize: 200,
    vacant: true,
    buildingId: pickerBuildingId === '' ? undefined : pickerBuildingId,
  })
  const vacantRooms = roomsQuery.data?.data ?? []
  const buildingsQuery = useBuildings({ pageSize: 200 })
  const customersQuery = useCustomers({ pageSize: 200 })
  const customers = customersQuery.data?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<CreateLeaseFormValues>({
    resolver: zodResolver(createLeaseFormSchema) as never,
    defaultValues: {
      roomId: 0,
      signatoryId: 0,
      startDate: today(),
      durationMonths: 12,
      occupantCount: 1,
      // Left blank on purpose. The schema requires a value, so submitting
      // without one asks for it rather than recording a zero nobody entered.
      depositMonths: undefined,
    },
  })

  /**
   * The chosen room's last known meter reading, filled in as soon as a room is
   * picked.
   *
   * Shown rather than explained. The API would default to this figure anyway if
   * the field were left empty, but a default nobody can see is a default nobody
   * can check — and this is the number the tenant's first electricity bill is
   * measured from. Put it in the box and the owner can compare it against the
   * meter on the wall and correct it.
   *
   * A room never let before has no reading to offer, and the field stays empty
   * and required: there is genuinely nothing to fall back on.
   */
  const chosenRoomId = useWatch({ control, name: 'roomId' })
  const meterQuery = useRoomMeterReading(chosenRoomId || undefined)

  // Which room's reading has already been written in, so a value the owner has
  // since corrected is not overwritten every time this re-renders.
  const filledFor = useRef<number | null>(null)

  useEffect(() => {
    if (!open) {
      filledFor.current = null
      return
    }
    const reading = meterQuery.data?.reading
    if (chosenRoomId && reading !== undefined && filledFor.current !== chosenRoomId) {
      filledFor.current = chosenRoomId
      setValue('startMeterReading', reading ?? undefined)
    }
  }, [open, chosenRoomId, meterQuery.data, setValue])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setPickerBuildingId('')
    reset({
      roomId: roomId ?? 0,
      signatoryId: 0,
      startDate: today(),
      durationMonths: 12,
      occupantCount: 1,
      depositMonths: undefined,
    })
  }, [open, roomId, reset])

  async function onSubmit(values: CreateLeaseFormValues) {
    setFormError(null)
    try {
      const input = createLeaseFormSchema.parse(values)
      const lease = await createMutation.mutateAsync(input)
      onCreated(lease)
      onClose()
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Something went wrong. Please try again.')
        return
      }

      /**
       * The room was let between opening this form and submitting it.
       *
       * Reported against the room, because that is the only answer now wrong —
       * the dates, the person and the deposit the owner entered are all still
       * what they meant. Clearing the form would make them type it again to
       * change one field.
       */
      if (error.isConflict) {
        setError('roomId', { type: 'server', message: error.message })
        return
      }

      const fieldErrors = error.fieldErrors
      let attributed = false
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (field in values && messages[0]) {
          setError(field as keyof CreateLeaseFormValues, { type: 'server', message: messages[0] })
          attributed = true
        }
      }
      if (!attributed) setFormError(error.message)
    }
  }

  const fixedRoom = roomId ? vacantRooms.find((room) => room.id === roomId) : undefined

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>New lease</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}

        <Stack
          spacing={2}
          component="form"
          id="lease-form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          sx={{ mt: 1 }}
        >
          {fixedRoom ? (
            <TextField
              label="Room"
              fullWidth
              value={`${fixedRoom.roomCode} · ${fixedRoom.building.displayName}`}
              slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
              error={Boolean(errors.roomId)}
              helperText={errors.roomId?.message ?? 'Signing a tenancy for this room'}
            />
          ) : (
            <>
              <TextField
                select
                label="Building"
                fullWidth
                value={pickerBuildingId === '' ? '' : String(pickerBuildingId)}
                onChange={(event) => {
                  setPickerBuildingId(event.target.value === '' ? '' : Number(event.target.value))
                  // The chosen room belongs to the building being left, so it
                  // cannot stay selected.
                  setValue('roomId', 0)
                }}
                helperText="Narrows the rooms below"
              >
                <MenuItem value="">All buildings</MenuItem>
                {(buildingsQuery.data?.data ?? []).map((building) => (
                  <MenuItem key={building.id} value={String(building.id)}>
                    {building.displayName}
                  </MenuItem>
                ))}
              </TextField>

            <Controller
              name="roomId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Room"
                  fullWidth
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.roomId)}
                  helperText={errors.roomId?.message ?? 'Only rooms with no running tenancy'}
                >
                  {vacantRooms.map((room) => (
                    <MenuItem key={room.id} value={String(room.id)}>
                      {/* The building is established above once chosen, so
                          repeating it on every row is noise. */}
                      {pickerBuildingId === ''
                        ? `${room.roomCode} · ${room.building.displayName}`
                        : room.roomCode}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            </>
          )}

          <Controller
            name="signatoryId"
            control={control}
            render={({ field }) => (
              <TextField
                select
                label="Tenant"
                fullWidth
                value={field.value ? String(field.value) : ''}
                onChange={(event) => field.onChange(Number(event.target.value))}
                onBlur={field.onBlur}
                inputRef={field.ref}
                error={Boolean(errors.signatoryId)}
                helperText={
                  errors.signatoryId?.message ?? 'The person responsible for the agreement'
                }
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={String(customer.id)}>
                    {customer.fullName}
                    {customer.phone ? ` · ${customer.phone}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <TextField
            label="Start date"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.startDate)}
            helperText={errors.startDate?.message}
            {...register('startDate')}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Duration"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={Boolean(errors.durationMonths)}
              helperText={errors.durationMonths?.message ?? 'Months'}
              {...register('durationMonths', { valueAsNumber: true })}
            />
            <TextField
              label="Bill for"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={Boolean(errors.occupantCount)}
              // Named for what it does. It drives utility billing and is NOT the
              // number of people recorded on the tenancy — the two are kept
              // apart deliberately, and may legitimately differ.
              helperText={errors.occupantCount?.message ?? 'People, for utilities'}
              {...register('occupantCount', { valueAsNumber: true })}
            />
          </Stack>

          <TextField
            label="Deposit"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            error={Boolean(errors.depositMonths)}
            /**
             * Required, and 0 is a valid answer.
             *
             * Left blank rather than defaulted to zero: a default would record
             * "no deposit was taken" and "nobody filled this in" identically,
             * and months later only one of those is safe to refund against.
             */
            helperText={
              errors.depositMonths?.message ?? "Months of rent. Enter 0 if no deposit was taken"
            }
            {...register('depositMonths', { valueAsNumber: true })}
          />

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Agreed rent"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              error={Boolean(errors.baseRent)}
              helperText={errors.baseRent?.message ?? "Blank: the room's current rent"}
              {...register('baseRent', {
                // An empty number input reads as NaN, which the schema would
                // reject. Undefined is what "leave it to the API" looks like.
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
            <TextField
              label="Opening meter reading"
              type="number"
              fullWidth
              slotProps={{
                htmlInput: { min: 0, step: 1 },
                /**
                 * Forced up, because this field is filled programmatically.
                 *
                 * MUI decides whether the label floats by watching the input's
                 * own events. `setValue` writes the value straight into the
                 * form state without dispatching one, so MUI still believes the
                 * field is empty and leaves the label sitting across the middle
                 * of it — printed on top of the number it just filled in.
                 */
                inputLabel: { shrink: true },
              }}
              error={Boolean(errors.startMeterReading)}
              helperText={
                errors.startMeterReading?.message ??
                (meterQuery.isFetching
                  ? 'Reading the room…'
                  : meterQuery.data?.reading !== null && meterQuery.data?.reading !== undefined
                    ? "The room's last known reading — correct it if the meter says otherwise"
                    : chosenRoomId
                      ? 'This room has no earlier reading, so it needs one'
                      : undefined)
              }
              {...register('startMeterReading', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
          </Stack>

          {!fixedRoom && vacantRooms.length === 0 && !roomsQuery.isPending && (
            <Alert severity="info">
              <AlertTitle>
                {pickerBuildingId === ''
                  ? 'Every room is let'
                  : 'Every room in this building is let'}
              </AlertTitle>
              A tenancy has to end before its room can take another.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="lease-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
