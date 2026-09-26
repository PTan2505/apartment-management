import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import Chip from '@mui/material/Chip'
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

import { useIsOwner } from '@/features/auth/useAuth'
import { MoneyField } from '@/components/MoneyField'
import { isApiError } from '@/lib/api-error'
import { MOBILE_BREAKPOINT } from '@/app/theme'
import { useBuildings } from '@/features/buildings/hooks'
import { IdCardPicker } from '@/features/customers/IdCardPicker'
import * as customersApi from '@/features/customers/api'
import { useCreateCustomer, useCustomers } from '@/features/customers/hooks'
import type { Customer } from '@/features/customers/types'
import { useRoom, useRoomMeterReading, useRooms } from '@/features/rooms/hooks'
import { attachContractPages, CONTRACT_ACCEPT } from '@/features/leases/api'
import { formatDate } from '@/features/leases/dates'
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
/** KB under a megabyte: a 60 KB scan shown as "0.1 MB" reads as an empty file. */
function coTep(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function LeaseFormDialog({ open, roomId, onClose, onCreated }: LeaseFormDialogProps) {
  const isOwner = useIsOwner()
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down(MOBILE_BREAKPOINT))

  const createMutation = useCreateLease()
  const createCustomerMutation = useCreateCustomer()
  const [formError, setFormError] = useState<string | null>(null)
  const isSubmitting = createMutation.isPending

  /** Set only when the tenancy was created but a file did not attach. */
  const [createdLease, setCreatedLease] = useState<Lease | null>(null)

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
  /*
    The rooms that can take a tenancy BEGINNING on the chosen date.

    Not `vacant`, which answers "free right now" — a different question, and the
    wrong one here. A room whose tenant leaves at the end of the month can take
    a tenancy from the 1st, and a room free today cannot take one starting last
    month. Asking the wrong question got both wrong, and the owner met the
    difference as a refusal after filling in the whole form.
  */
  const startDate = useWatch({ control, name: 'startDate' })
  const roomsQuery = useRooms(
    {
      pageSize: 200,
      availableOn: startDate || undefined,
      buildingId: pickerBuildingId === '' ? undefined : pickerBuildingId,
    },
    Boolean(startDate),
  )
  const vacantRooms = roomsQuery.data?.data ?? []
  const chosenRoomId = useWatch({ control, name: 'roomId' })
  /**
   * A room chosen under one date that the new date cannot take.
   *
   * Cleared, and said out loud. Carrying it silently would move the refusal to
   * the submission — the exact failure asking for the date first removes — and
   * clearing it without a word would leave the owner submitting a form they
   * believe still names a room.
   */
  const [roomDropped, setRoomDropped] = useState<string | null>(null)
  useEffect(() => {
    if (!open || roomId || !startDate || roomsQuery.isPending) return
    if (!chosenRoomId) return
    /*
      Not while submitting, and not once the tenancy exists.

      Creating the tenancy takes the room — so the list refetches without it,
      and this fired: "phòng đang chọn không trống", on a form that had just
      succeeded. The room being gone from the list is the CONSEQUENCE of the
      signing, not a problem with it.
    */
    if (isSubmitting || createdLease !== null) return
    if (vacantRooms.some((room) => room.id === chosenRoomId)) return
    setValue('roomId', 0)
    setRoomDropped(`Phòng đang chọn không trống từ ${formatDate(startDate)}. Hãy chọn phòng khác.`)
  }, [
    open,
    roomId,
    startDate,
    chosenRoomId,
    vacantRooms,
    roomsQuery.isPending,
    isSubmitting,
    createdLease,
    setValue,
  ])
  // A fresh choice answers the message.
  useEffect(() => {
    if (chosenRoomId) setRoomDropped(null)
  }, [chosenRoomId])
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
      // The rent too, rather than a note saying what an empty box would mean.
      // A figure in the box is a figure the owner can read against the
      // agreement in front of them and correct; a note about a default is
      // something they have to take on trust and cannot check.
      const chosen = vacantRooms.find((room) => room.id === chosenRoomId)
      if (chosen) {
        setValue('baseRent', chosen.baseRent)
        // The utility rates too. A room reports only which building it is in —
        // rates belong to the building's own record — so they come from the
        // buildings already loaded for the picker above, not a second request.
        const building = (buildingsQuery.data?.data ?? []).find(
          (candidate) => candidate.id === chosen.buildingId,
        )
        if (building) {
          setValue('electricityRate', building.electricityRate)
          setValue('waterRatePerPerson', building.waterRatePerPerson)
          // And the deposit, for the same reason as the rent: a figure in the
          // box can be read against the agreement in front of whoever is
          // signing. It used to be left blank on the argument that a default
          // would hide "nobody filled this in" — but this default is a number
          // the OWNER stated on the building, not a guess, so the argument no
          // longer holds.
          setValue('depositMonths', building.defaultDepositMonths)
        }
      }
    }
  }, [open, chosenRoomId, meterQuery.data, setValue, vacantRooms, buildingsQuery.data])

  useEffect(() => {
    if (!open) return
    setFormError(null)
    setPickerBuildingId('')
    setMatched(null)
    createdRef.current = null
    setIdCardFront(null)
    setIdCardBack(null)
    setContractFiles([])
    setCreatedLease(null)
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

  /**
   * The two sides of the signatory's ID card, chosen here and uploaded AFTER
   * the tenancy exists. Ordering it that way means a photograph that fails to
   * upload cannot cost the owner the tenancy — it costs them the photograph,
   * which the tenancy's own page can take again.
   */
  const [idCardFront, setIdCardFront] = useState<File | null>(null)
  const [idCardBack, setIdCardBack] = useState<File | null>(null)
  /** The signed contract, chosen here and attached after the tenancy exists —
   *  same ordering as the ID card, and for the same reason. */
  // The photographed pages of the signed contract. Several, because a contract
  // is several pages of paper.
  const [contractFiles, setContractFiles] = useState<File[]>([])
  const contractInput = useRef<HTMLInputElement>(null)


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

      // The tenancy exists from here on. Neither of these throws for that
      // reason: a file that fails to upload is reported as a file that failed,
      // not as a failed signing.
      const { failed } = await customersApi.attachIdCards(signatoryId, {
        front: idCardFront,
        back: idCardBack,
      })
      const contractFailed =
        contractFiles.length === 0 ? 0 : await attachContractPages(lease.id, contractFiles)
      const contractOk = contractFailed === 0
      if (failed.length > 0 || !contractOk) {
        /*
          The tenancy exists; the photographs do not. Both halves have to reach
          the owner, so this does NOT navigate: calling `onCreated` here would
          leave the tenancy's page open with the message unmounted along with
          this dialog — which is exactly what happened the first time, and the
          failure looked like a success.

          The dialog stays, says what happened, and offers the way on.
        */
        const thieu = [
          ...failed.map((side) => (side === 'front' ? 'ảnh mặt trước căn cước' : 'ảnh mặt sau căn cước')),
          ...(contractOk ? [] : [`${contractFailed} ảnh hợp đồng`]),
        ].join(', ')
        setFormError(
          `Đã tạo hợp đồng, nhưng chưa tải lên được: ${thieu}. ` +
            'Mở hợp đồng để tải lại.',
        )
        setCreatedLease(lease)
        return
      }

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
       * The person already lives somewhere else.
       *
       * Against the SIGNATORY, not the room. This sits above the general
       * conflict branch below, which attributes everything to the room — a
       * reasonable default when the only 409 was "that room is taken", and
       * exactly wrong for this one. "Người này đang thuê phòng P302" under a
       * field labelled Phòng reads as a complaint about the room the owner just
       * picked, and sends them to change the one answer that was right.
       */
      if (error.isConflict && error.code === 'SIGNATORY_ALREADY_HOUSED') {
        setError('signatory', { type: 'server', message: errorMessage(error) })
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

  /*
    The room the form was opened with, looked up on its own.
    
    NOT found in the list above: that list is now "rooms free from the chosen
    date", and a room the owner arrived from may not be in it — which would
    have made the room silently disappear and the picker appear in its place.
  */
  const fixedRoomQuery = useRoom(roomId, open)
  const fixedRoom = roomId ? fixedRoomQuery.data : undefined
  // Whether that room can actually take a tenancy beginning then. The list is
  // the authority; being absent from it is the answer.
  const fixedRoomFits =
    fixedRoom === undefined ||
    !startDate ||
    roomsQuery.isPending ||
    vacantRooms.some((room) => room.id === fixedRoom.id)

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
          {/*
            The date leads, because it is what makes the room question
            answerable. Asked after the room, as it was, the form offers the
            rooms free TODAY — neither the question nor the answer — and the
            refusal arrives only once everything else has been filled in.
          */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Ngày bắt đầu"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.startDate)}
              helperText={errors.startDate?.message ?? 'Ngày khách bắt đầu ở'}
              {...register('startDate')}
            />
            {/*
              Asked for here because this is the moment the paper is in the
              owner's hand. It was previously only in the correction dialog —
              a moment that rarely comes, so the date was recorded rarely.

              Optional: a tenancy entered from an old paper file may have no
              date anyone remembers, and demanding one turns missing history
              into an obstacle.
            */}
            <TextField
              label="Ngày ký hợp đồng"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(errors.handoverSignedAt)}
              helperText={
                errors.handoverSignedAt?.message ?? 'Ngày ký hợp đồng giấy. Để trống nếu chưa ký'
              }
              {...register('handoverSignedAt')}
            />
          </Stack>

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
                  disabled={!startDate}
                  error={Boolean(errors.roomId)}
                  helperText={
                    errors.roomId?.message ??
                    (!startDate
                      ? 'Chọn ngày bắt đầu trước, rồi mới chọn được phòng'
                      : roomsQuery.isPending
                        ? 'Đang tìm phòng trống cho ngày này…'
                        : vacantRooms.length === 0
                          ? 'Không có phòng nào trống từ ngày này'
                          : `Phòng trống từ ${formatDate(startDate)}`)
                  }
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

          {roomDropped && <Alert severity="warning">{roomDropped}</Alert>}

          {/*
            The room the owner arrived with, which the new date cannot take.
            Said rather than silently kept: the API would refuse it, and the
            refusal would arrive after everything else was filled in.
          */}
          {fixedRoom && !fixedRoomFits && (
            <Alert severity="warning">
              Phòng {fixedRoom.roomCode} không trống từ {formatDate(startDate)} — hợp đồng cũ của
              phòng chưa kết thúc. Hãy chọn ngày khác.
            </Alert>
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



          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Thời hạn"
              type="number"
              fullWidth
              slotProps={{
                htmlInput: { min: 1, step: 1 },
                // The unit belongs in the field, not only in the hint below it:
                // the hint is read once and the box is read every time.
                input: {
                  endAdornment: <InputAdornment position="end">tháng</InputAdornment>,
                },
              }}
              error={Boolean(errors.durationMonths)}
              helperText={errors.durationMonths?.message ?? 'Số tháng'}
              {...register('durationMonths', { valueAsNumber: true })}
            />
            <TextField
              label="Tính cho"
              type="number"
              fullWidth
              slotProps={{
                htmlInput: { min: 1, step: 1 },
                input: {
                  endAdornment: <InputAdornment position="end">người</InputAdornment>,
                },
              }}
              error={Boolean(errors.occupantCount)}
              // Named for what it does. It drives utility billing and is NOT the
              // number of people recorded on the tenancy — the two are kept
              // apart deliberately, and may legitimately differ.
              helperText={errors.occupantCount?.message ?? 'Số người, dùng tính tiền nước'}
              {...register('occupantCount', { valueAsNumber: true })}
            />
          </Stack>

          <TextField
            label="Tiền cọc"
            type="number"
            fullWidth
            slotProps={{
              htmlInput: { min: 0, step: 1 },
              // Months of rent, not currency — the unit is what keeps the field
              // from reading as an amount in đồng.
              input: {
                readOnly: !isOwner,
                endAdornment: <InputAdornment position="end">tháng</InputAdornment>,
              },
            }}
            error={Boolean(errors.depositMonths)}
            /**
             * The owner's to set; 0 is a valid answer.
             *
             * For the owner, left blank rather than defaulted: a blank means
             * "use the building's figure", which the API resolves, while a
             * typed 0 means "no deposit on this one". For a manager it is
             * filled from the building and read-only — they quote the number
             * to the person signing, so it has to be legible, and it is not
             * theirs to move.
             */
            helperText={
              errors.depositMonths?.message ??
              (isOwner
                ? 'Số tháng tiền thuê. Để trống là lấy theo toà nhà, nhập 0 nếu không thu cọc'
                : 'Theo toà nhà. Chủ nhà là người đổi số này.')
            }
            {...register('depositMonths', { valueAsNumber: true })}
          />

          <Divider />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <MoneyField
              control={control}
              name="baseRent"
              label="Giá thuê thoả thuận"
              unit="đ / tháng"
              // Filled from the room when one is chosen, and editable from
              // there FOR THE OWNER. An empty box still means "leave it to the
              // API", which is what an owner who clears it is asking for.
              readOnly={!isOwner}
              helperText={
                isOwner
                  ? 'Điền sẵn theo giá thuê của phòng. Sửa được nếu thoả thuận khác.'
                  : 'Theo giá thuê của phòng. Chủ nhà là người đổi giá này.'
              }
            />
            <TextField
              label="Số điện đầu kỳ"
              type="number"
              fullWidth
              slotProps={{
                htmlInput: { min: 0, step: 1 },
                input: {
                  endAdornment: <InputAdornment position="end">kWh</InputAdornment>,
                },
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

          <Divider />

          {/*
            The tenant's ID card, attached to the PERSON rather than to this
            tenancy: somebody has one card whatever they rent. Optional — the
            owner may not have it to hand — and for a tenant already on file,
            choosing nothing leaves whatever they had alone.
          */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Căn cước công dân của người đứng tên
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <IdCardPicker
                label="Mặt trước"
                file={idCardFront}
                onChange={setIdCardFront}
                disabled={isSubmitting}
              />
              <IdCardPicker
                label="Mặt sau"
                file={idCardBack}
                onChange={setIdCardBack}
                disabled={isSubmitting}
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Không bắt buộc. Ảnh được lưu cho khách, dùng lại cho các hợp đồng sau.
            </Typography>
          </Box>

          {/*
            The signed contract. Optional and attached after the tenancy is
            created, like the ID card — a scan that fails to upload must not
            cost the owner the signing.
          */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Bản hợp đồng đã ký
            </Typography>
            {contractFiles.length === 0 ? (
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                disabled={isSubmitting}
                onClick={() => contractInput.current?.click()}
              >
                Chọn ảnh
              </Button>
            ) : (
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {contractFiles.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    label={`Trang ${index + 1} · ${coTep(file.size)}`}
                    onDelete={
                      isSubmitting
                        ? undefined
                        : () => setContractFiles((cu) => cu.filter((_, i) => i !== index))
                    }
                    sx={{ maxWidth: '100%' }}
                  />
                ))}
                <Chip
                  label="Thêm ảnh"
                  variant="outlined"
                  onClick={isSubmitting ? undefined : () => contractInput.current?.click()}
                />
              </Stack>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Không bắt buộc. Chụp từng trang hợp đồng đã ký, chọn được nhiều ảnh một lần. JPG,
              PNG hoặc HEIC, mỗi ảnh tối đa 20 MB.
            </Typography>
            <input
              ref={contractInput}
              type="file"
              accept={CONTRACT_ACCEPT}
              multiple
              hidden
              onChange={(event) => {
                const them = [...(event.target.files ?? [])]
                if (them.length > 0) setContractFiles((cu) => [...cu, ...them])
                event.target.value = ''
              }}
            />
          </Box>

          {/*
            The rates this tenancy will be billed at, filled from the building
            when a room is chosen. Shown rather than left implicit: a tenancy
            keeps its own copy, so this is the moment the figures are fixed, and
            a price agreed with this tenant in particular is recorded here
            without changing what the building charges the next one.
          */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <MoneyField
              control={control}
              name="electricityRate"
              label="Giá điện"
              unit="đ / kWh"
              decimals
              readOnly={!isOwner}
              helperText={
                isOwner
                  ? 'Điền sẵn theo toà nhà. Hợp đồng này giữ giá đã ghi ở đây.'
                  : 'Theo toà nhà. Chủ nhà là người đổi giá này.'
              }
            />
            <MoneyField
              control={control}
              name="waterRatePerPerson"
              label="Giá nước"
              unit="đ / người / tháng"
              decimals
              readOnly={!isOwner}
              helperText={
                isOwner
                  ? 'Điền sẵn theo toà nhà. Sửa được nếu thoả thuận khác.'
                  : 'Theo toà nhà. Chủ nhà là người đổi giá này.'
              }
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
        {createdLease === null ? (
          <>
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
          </>
        ) : (
          // The tenancy was created and the images were not. Signing again would
          // make a second tenancy, so that button is gone; what is left is the
          // way to the page where the images can be attached again.
          <Button variant="contained" onClick={() => onCreated(createdLease)}>
            Mở hợp đồng
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
