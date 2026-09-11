import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
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
import { useCreateCustomer, useCustomers } from '@/features/customers/hooks'
import type { Customer } from '@/features/customers/types'
import { useRoomMeterReading, useRooms } from '@/features/rooms/hooks'
import { useCreateLease } from '@/features/leases/hooks'
import { createLeaseFormSchema, type CreateLeaseFormValues } from '@/features/leases/schema'
import type { Lease } from '@/features/leases/types'
import { errorMessage } from '@/lib/error-messages'

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
  const createCustomerMutation = useCreateCustomer()
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
      // Starts as an unchosen EXISTING person rather than a blank new one: the
      // common case is picking somebody already on file, and a form that opens
      // asking for a phone number asks for one it usually already has.
      signatory: { kind: 'existing', customerId: 0 },
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
    setMatched(null)
    createdRef.current = null
    reset({
      roomId: roomId ?? 0,
      signatory: { kind: 'existing', customerId: 0 },
      startDate: today(),
      durationMonths: 12,
      occupantCount: 1,
      depositMonths: undefined,
    })
  }, [open, roomId, reset])

  /**
   * A phone number that turned out to belong to somebody already on file.
   *
   * Held rather than acted on. `POST /customers` answers 200 in this case and
   * returns whoever holds the number — DISCARDING the name that was typed — so
   * proceeding would attach the tenancy to a record the owner never read. It is
   * worst in the case that looks most ordinary: a returning tenant whose name
   * is spelled slightly differently.
   *
   * It cannot be caught afterwards by comparing the returned name against the
   * typed one, because those agree exactly when the existing person happens to
   * share the name.
   */
  const [matched, setMatched] = useState<Customer | null>(null)

  /**
   * The person created for this attempt, kept if the lease then fails.
   *
   * The two calls are not atomic and deliberately in this order: a person with
   * no tenancy is a record the owner can use, while a tenancy without its
   * signatory cannot exist at all — the lease endpoint requires the id. Keeping
   * them means a retry reuses that person instead of making a second one.
   */
  const createdRef = useRef<Customer | null>(null)

  async function resolveSignatoryId(
    signatory: CreateLeaseFormValues['signatory'],
  ): Promise<number | null> {
    if (signatory.kind === 'existing') return signatory.customerId
    if (createdRef.current) return createdRef.current.id

    const result = await createCustomerMutation.mutateAsync({
      fullName: signatory.fullName.trim(),
      phone: signatory.phone.trim(),
    })
    if (!result.created) {
      // Stop. See `matched` above.
      setMatched(result.customer)
      return null
    }
    createdRef.current = result.customer
    return result.customer.id
  }

  async function onSubmit(values: CreateLeaseFormValues) {
    setFormError(null)
    try {
      const signatoryId = await resolveSignatoryId(values.signatory)
      if (signatoryId === null) return

      const input = { ...createLeaseFormSchema.parse(values), signatoryId }
      const lease = await createMutation.mutateAsync(input)
      onCreated(lease)
      onClose()
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Có lỗi xảy ra. Vui lòng thử lại.')
        return
      }

      /*
        The number belongs to an account that is NOT a customer — an owner.
        The API reports this apart from a customer match, and rightly: saying
        only "this number is taken" would send the owner looking for a customer
        who does not exist.

        The code was checked against the service rather than guessed; an
        invented code would silently fall through to the generic branch.
      */
      if (error.isConflict && error.code === 'PHONE_BELONGS_TO_ANOTHER') {
        setError('signatory.phone', { type: 'server', message: errorMessage(error) })
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
        setError('roomId', { type: 'server', message: errorMessage(error) })
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
      if (!attributed) setFormError(errorMessage(error))
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
      <DialogTitle>Hợp đồng mới</DialogTitle>
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
              label="Phòng"
              fullWidth
              value={`${fixedRoom.roomCode} · ${fixedRoom.building.displayName}`}
              slotProps={{ input: { readOnly: true }, inputLabel: { shrink: true } }}
              error={Boolean(errors.roomId)}
              helperText={errors.roomId?.message ?? 'Đang ký hợp đồng cho phòng này'}
            />
          ) : (
            <>
              <TextField
                select
                label="Toà nhà"
                fullWidth
                value={pickerBuildingId === '' ? '' : String(pickerBuildingId)}
                onChange={(event) => {
                  setPickerBuildingId(event.target.value === '' ? '' : Number(event.target.value))
                  // The chosen room belongs to the building being left, so it
                  // cannot stay selected.
                  setValue('roomId', 0)
                }}
                helperText="Lọc bớt danh sách phòng bên dưới"
              >
                <MenuItem value="">Tất cả toà nhà</MenuItem>
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
                  label="Phòng"
                  fullWidth
                  value={field.value ? String(field.value) : ''}
                  onChange={(event) => field.onChange(Number(event.target.value))}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  error={Boolean(errors.roomId)}
                  helperText={errors.roomId?.message ?? 'Chỉ những phòng chưa có hợp đồng đang chạy'}
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
            name="signatory"
            control={control}
            render={({ field }) => {
              const value = field.value
              const picked =
                value.kind === 'existing' && value.customerId
                  ? (customers.find((c) => c.id === value.customerId) ?? null)
                  : null
              const typedName = value.kind === 'new' ? value.fullName : ''
              /*
                Whether what has been typed still matches somebody on file.

                The phone field appears only once it matches NOBODY. Keying it
                on "the name is non-empty" instead — which this did at first —
                pops the field open on the first keystroke of an existing
                customer's name, asking for a number the system already holds
                and that the owner is about to select anyway.
              */
              const stillMatches =
                typedName.trim() !== '' &&
                customers.some((c) =>
                  `${c.fullName} ${c.phone ?? ''}`
                    .toLowerCase()
                    .includes(typedName.trim().toLowerCase()),
                )
              const signatoryError = errors.signatory as
                | { message?: string; fullName?: { message?: string }; phone?: { message?: string }; customerId?: { message?: string } }
                | undefined

              return (
                <>
                  {/*
                    One control, two outcomes: a customer already on file, or a
                    name that is not yet anybody.

                    A second "add a customer" dialog on top of this one was the
                    obvious alternative and is worse — it is the detour this
                    change exists to remove, moved inside the form.
                  */}
                  <Autocomplete
                    freeSolo
                    // Every other field on this form is full width; without
                    // this one the row it sits in is visibly narrower.
                    fullWidth
                    options={customers}
                    value={picked}
                    /*
                      ALWAYS controlled. Passing `undefined` when somebody is
                      picked — which this did at first — flips the component
                      between controlled and uncontrolled, and MUI then resets
                      the text on blur: clicking the submit button wiped the
                      typed name, and the form refused with "nhập tên" for a
                      name that had just been on screen.
                    */
                    inputValue={
                      picked
                        ? `${picked.fullName}${picked.phone ? ` · ${picked.phone}` : ''}`
                        : typedName
                    }
                    onInputChange={(_event, input, reason) => {
                      /*
                        Only what the owner TYPED. A blocklist of reasons was
                        the first attempt and let one through: MUI clears the
                        text on blur, so clicking the submit button wiped the
                        name and the form refused with "nhập tên" for a name
                        that had just been on screen.
                      */
                      if (reason !== 'input') return
                      // Typing past a chosen person means they are no longer the
                      // one meant; fall back to a name nobody holds yet.
                      field.onChange({ kind: 'new', fullName: input, phone: value.kind === 'new' ? value.phone : '' })
                    }}
                    onChange={(_event, chosen) => {
                      if (chosen && typeof chosen !== 'string') {
                        field.onChange({ kind: 'existing', customerId: chosen.id })
                        return
                      }
                      field.onChange({
                        kind: 'new',
                        fullName: typeof chosen === 'string' ? chosen : '',
                        phone: value.kind === 'new' ? value.phone : '',
                      })
                    }}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option
                        : `${option.fullName}${option.phone ? ` · ${option.phone}` : ''}`
                    }
                    isOptionEqualToValue={(option, selected) =>
                      typeof option !== 'string' && typeof selected !== 'string' && option.id === selected.id
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Người đứng tên"
                        fullWidth
                        onBlur={field.onBlur}
                        error={Boolean(signatoryError?.message ?? signatoryError?.fullName?.message ?? signatoryError?.customerId?.message)}
                        helperText={
                          signatoryError?.message ??
                          signatoryError?.fullName?.message ??
                          signatoryError?.customerId?.message ??
                          'Gõ để tìm khách cũ, hoặc nhập tên khách mới'
                        }
                      />
                    )}
                  />

                  {/*
                    Shown only once the typed name matches nobody. Always showing
                    it would ask for a number the system usually already holds.
                  */}
                  {value.kind === 'new' && value.fullName.trim() !== '' && !stillMatches && (
                    <TextField
                      label="Số điện thoại"
                      fullWidth
                      value={value.phone}
                      onChange={(event) =>
                        field.onChange({ ...value, phone: event.target.value })
                      }
                      error={Boolean(signatoryError?.phone?.message)}
                      helperText={
                        signatoryError?.phone?.message ??
                        'Khách mới — số điện thoại là thứ dùng để nhận ra họ lần sau'
                      }
                    />
                  )}
                </>
              )
            }}
          />

          {/*
            The number matched somebody already on file.

            Shown and waited on, never auto-accepted: the API kept the name it
            already held and threw away the one just typed, so continuing would
            sign the tenancy to a record the owner has not read.

            Not refused either — a returning tenant IS that person, and making
            the owner go and find them by hand restores the detour this whole
            change removes.
          */}
          {matched && (
            <Alert
              severity="warning"
              action={
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => {
                      setMatched(null)
                      setValue('signatory', { kind: 'existing', customerId: matched.id })
                    }}
                  >
                    Dùng người này
                  </Button>
                  <Button size="small" color="inherit" onClick={() => setMatched(null)}>
                    Sửa lại
                  </Button>
                </Stack>
              }
            >
              <AlertTitle>Số điện thoại này đã có người dùng</AlertTitle>
              Số {matched.phone} đang thuộc về <strong>{matched.fullName}</strong>. Tên bạn
              vừa nhập sẽ không được lưu — hệ thống giữ tên đang có. Nếu đúng là người này
              thì chọn "Dùng người này", còn không thì sửa lại số.
            </Alert>
          )}

          <TextField
            label="Ngày bắt đầu"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            error={Boolean(errors.startDate)}
            helperText={errors.startDate?.message}
            {...register('startDate')}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Thời hạn"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={Boolean(errors.durationMonths)}
              helperText={errors.durationMonths?.message ?? 'Số tháng'}
              {...register('durationMonths', { valueAsNumber: true })}
            />
            <TextField
              label="Tính cho"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              error={Boolean(errors.occupantCount)}
              // Named for what it does. It drives utility billing and is NOT the
              // number of people recorded on the tenancy — the two are kept
              // apart deliberately, and may legitimately differ.
              helperText={errors.occupantCount?.message ?? 'Số người, dùng tính điện nước'}
              {...register('occupantCount', { valueAsNumber: true })}
            />
          </Stack>

          <TextField
            label="Tiền cọc"
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
              errors.depositMonths?.message ?? 'Số tháng tiền thuê. Nhập 0 nếu không thu cọc'
            }
            {...register('depositMonths', { valueAsNumber: true })}
          />

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Giá thuê thoả thuận"
              type="number"
              fullWidth
              slotProps={{ htmlInput: { min: 0, step: 'any' } }}
              error={Boolean(errors.baseRent)}
              helperText={errors.baseRent?.message ?? 'Để trống: lấy giá thuê hiện tại của phòng'}
              {...register('baseRent', {
                // An empty number input reads as NaN, which the schema would
                // reject. Undefined is what "leave it to the API" looks like.
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
            <TextField
              label="Số điện đầu kỳ"
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
                  ? 'Đang lấy số điện của phòng…'
                  : meterQuery.data?.reading !== null && meterQuery.data?.reading !== undefined
                    ? 'Số điện gần nhất của phòng — sửa lại nếu công tơ khác'
                    : chosenRoomId
                      ? 'Phòng này chưa có số điện nào, cần nhập'
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
                  ? 'Mọi phòng đều đã cho thuê'
                  : 'Every room in this building is let'}
              </AlertTitle>
              Phải kết thúc hợp đồng cũ thì phòng mới nhận được hợp đồng khác.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          type="submit"
          form="lease-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang tạo…' : 'Tạo hợp đồng'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
