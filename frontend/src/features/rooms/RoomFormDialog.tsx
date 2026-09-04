import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { isApiError } from '@/lib/api-error'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useBuildings } from '@/features/buildings/hooks'
import { useCreateRoom, useUpdateRoom } from '@/features/rooms/hooks'
import {
  createRoomFormSchema,
  updateRoomFormSchema,
  type CreateRoomFormValues,
} from '@/features/rooms/schema'
import type { Room } from '@/features/rooms/types'
import { errorMessage } from '@/lib/error-messages'

interface RoomFormDialogProps {
  open: boolean
  /** The room being edited, or null to create one. */
  room: Room | null
  /** Fixes the building when creating from within one; omit to choose. */
  buildingId?: number
  onClose: () => void
  onCreated?: () => void
}

/**
 * Create and edit are genuinely different forms, unlike buildings where one
 * dialog served both.
 *
 * A room's building is chosen once and cannot be changed: the API's update
 * schema accepts only the code and the rent. Offering a building selector when
 * editing would present a control that cannot do anything.
 */
export function RoomFormDialog({
  open,
  room,
  buildingId,
  onClose,
  onCreated,
}: RoomFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT))

  const isEdit = room !== null
  const createMutation = useCreateRoom()
  const updateMutation = useUpdateRoom()
  const [formError, setFormError] = useState<string | null>(null)
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Only buildings in service may take a new room — the API rejects a retired
  // one with a 400, and not offering it beats explaining the rejection.
  const buildingsQuery = useBuildings({ pageSize: 200 })
  const buildings = buildingsQuery.data?.data ?? []

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateRoomFormValues>({
    resolver: zodResolver(isEdit ? updateRoomFormSchema : createRoomFormSchema) as never,
    defaultValues: { buildingId: 0, roomCode: '', baseRent: 0 },
  })

  useEffect(() => {
    if (!open) return
    setFormError(null)
    reset(
      room
        ? { buildingId: room.buildingId, roomCode: room.roomCode, baseRent: room.baseRent }
        : {
            buildingId: buildingId ?? 0,
            roomCode: '',
            baseRent: 0,
            // Left EMPTY rather than defaulted to 0: an empty field means
            // nobody has said, and zero would be a statement the owner never
            // made about a meter they may not have looked at.
            initialMeterReading: undefined,
          },
    )
  }, [open, room, buildingId, reset])

  async function onSubmit(values: CreateRoomFormValues) {
    setFormError(null)
    try {
      if (room) {
        const input = updateRoomFormSchema.parse(values)
        await updateMutation.mutateAsync({ id: room.id, input })
      } else {
        const input = createRoomFormSchema.parse(values)
        await createMutation.mutateAsync(input)
        onCreated?.()
      }
      onClose()
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Có lỗi xảy ra. Vui lòng thử lại.')
        return
      }
      // A duplicate room code arrives as a conflict with a message naming the
      // code — more useful than anything this form could invent, and it is the
      // one rule the form deliberately does not check itself.
      const fieldErrors = error.fieldErrors
      let attributed = false
      for (const [field, messages] of Object.entries(fieldErrors)) {
        if (['buildingId', 'roomCode', 'baseRent'].includes(field) && messages[0]) {
          setError(field as keyof CreateRoomFormValues, { type: 'server', message: messages[0] })
          attributed = true
        }
      }
      if (!attributed) setFormError(errorMessage(error))
    }
  }

  const fixedBuilding = room
    ? room.building.displayName
    : buildingId
      ? buildings.find((b) => b.id === buildingId)?.displayName
      : undefined

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{isEdit ? 'Sửa phòng' : 'Thêm phòng'}</DialogTitle>
      <DialogContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Stack spacing={2} component="form"
          id="room-form"
          // The number inputs carry min={0}, which makes the browser block
          // submission itself — before react-hook-form runs, so the form's own
          // message never appears and the user sees a native tooltip or nothing.
          noValidate
          onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          {fixedBuilding !== undefined ? (
            <TextField
              label="Toà nhà"
              fullWidth
              value={fixedBuilding}
              slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
              helperText={
                isEdit
                  ? 'Không thể chuyển phòng sang toà nhà khác'
                  : 'Creating in this building'
              }
            />
          ) : (
            // MUI's select renders a custom widget rather than a plain
            // <select>, so `register` does not reliably bind to it. Controller
            // drives the value explicitly, which is also where the string the
            // widget reports becomes the number the API expects.
            <Controller
              name="buildingId"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Toà nhà"
                  fullWidth
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.buildingId)}
                  helperText={
                    errors.buildingId?.message ?? 'Chỉ toà nhà đang dùng mới thêm được phòng'
                  }
                >
                  {buildings.map((building) => (
                    <MenuItem key={building.id} value={String(building.id)}>
                      {building.displayName}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          )}

          <TextField
            label="Mã phòng"
            fullWidth
            autoFocus
            error={Boolean(errors.roomCode)}
            helperText={errors.roomCode?.message ?? 'Không trùng với phòng đang dùng trong toà nhà này'}
            {...register('roomCode')}
          />
          <TextField
            label="Giá thuê hàng tháng"
            type="number"
            fullWidth
            slotProps={{ htmlInput: { step: 'any', min: 0 } }}
            error={Boolean(errors.baseRent)}
            helperText={errors.baseRent?.message ?? 'Đồng mỗi tháng'}
            {...register('baseRent', { valueAsNumber: true })}
          />

          {/*
            Only when creating. The reading describes the moment the room was
            added; once any tenancy or vacancy record exists the room's position
            comes from those, so an editable field here would look like a way to
            correct history that it is not.

            Optional and non-blocking, but explained — an unexplained number
            field on a form gets skipped, and what it buys is not obvious. What
            it buys: without it, every month the room stands empty before its
            first tenancy is electricity the owner pays for and cannot record
            anywhere.
          */}
          {!isEdit && (
            <TextField
              label="Số điện hiện tại (không bắt buộc)"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { step: 1, min: 0 } }}
              error={Boolean(errors.initialMeterReading)}
              helperText={
                errors.initialMeterReading?.message ??
                'Chỉ là mốc khởi đầu, không bị tính tiền. Không có nó thì những tháng phòng trống trước hợp đồng đầu tiên sẽ không ghi được chi phí điện.'
              }
              {...register('initialMeterReading', { valueAsNumber: true })}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          type="submit"
          form="room-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang lưu…' : isEdit ? 'Lưu' : 'Tạo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
