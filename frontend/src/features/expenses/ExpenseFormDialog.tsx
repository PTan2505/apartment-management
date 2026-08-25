import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { isApiError } from '@/lib/api-error'
import { formatMoney } from '@/lib/format'
import { useBuildings } from '@/features/buildings/hooks'
import { useRooms } from '@/features/rooms/hooks'
import { useCreateExpense, useUpdateExpense } from '@/features/expenses/hooks'
import { CATEGORY_LABELS } from '@/features/expenses/labels'
import type { Expense, ExpenseCategory } from '@/features/expenses/types'

interface ExpenseFormDialogProps {
  open: boolean
  /** The cost being corrected, or null when recording a new one. */
  expense: Expense | null
  onClose: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Recording a cost, or correcting one.
 *
 * ── Why quantity-and-rate and amount are never both offered ────────────────
 *
 * The API computes the amount when a quantity and a rate are both supplied, and
 * that is precisely what stops a stored figure disagreeing with the numbers it
 * came from. A form showing all three fields at once invites an owner to type
 * an amount beside a basis that does not produce it — and then silently throws
 * away what they typed. So the form asks which kind of cost this is, and shows
 * only the fields that apply.
 *
 * ── What correcting can change ─────────────────────────────────────────────
 *
 * Only the kind, description, date and amount: those are what the API accepts
 * on an update. A measured cost's quantity and rate are not editable, so the
 * amount is edited directly — which is honest, since changing the basis of a
 * recorded measurement is a different claim from correcting its total.
 */
export function ExpenseFormDialog({ open, expense, onClose }: ExpenseFormDialogProps) {
  const isEditing = expense !== null
  const create = useCreateExpense()
  const update = useUpdateExpense()

  const [buildingId, setBuildingId] = useState<number | ''>('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [category, setCategory] = useState<ExpenseCategory>('repair')
  const [description, setDescription] = useState('')
  const [incurredAt, setIncurredAt] = useState(today())
  const [measured, setMeasured] = useState(false)
  const [quantity, setQuantity] = useState('')
  const [unitRate, setUnitRate] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  const buildingsQuery = useBuildings({ pageSize: 200 })
  const roomsQuery = useRooms({
    pageSize: 200,
    buildingId: buildingId === '' ? undefined : buildingId,
    includeInactive: true,
  })

  useEffect(() => {
    if (!open) return
    setError(null)
    if (expense) {
      setBuildingId(expense.buildingId)
      setRoomId(expense.roomId ?? '')
      setCategory(expense.category)
      setDescription(expense.description)
      setIncurredAt(expense.incurredAt.slice(0, 10))
      setMeasured(false)
      setAmount(String(expense.amount))
    } else {
      setBuildingId('')
      setRoomId('')
      setCategory('repair')
      setDescription('')
      setIncurredAt(today())
      setMeasured(false)
      setQuantity('')
      setUnitRate('')
      setAmount('')
    }
  }, [open, expense])

  const parsedQuantity = Number(quantity)
  const parsedRate = Number(unitRate)
  const derived =
    measured && quantity.trim() !== '' && unitRate.trim() !== '' && parsedQuantity > 0
      ? parsedQuantity * parsedRate
      : null

  const ready = isEditing
    ? description.trim() !== '' && Number(amount) > 0
    : buildingId !== '' &&
      description.trim() !== '' &&
      (measured ? derived !== null && derived > 0 : Number(amount) > 0)

  async function handleSubmit() {
    setError(null)
    try {
      if (isEditing) {
        await update.mutateAsync({
          id: expense.id,
          input: {
            category,
            description: description.trim(),
            incurredAt,
            amount: Number(amount),
          },
        })
      } else {
        await create.mutateAsync({
          buildingId: Number(buildingId),
          ...(roomId === '' ? {} : { roomId: Number(roomId) }),
          category,
          description: description.trim(),
          incurredAt,
          // One or the other, never both — see the note above.
          ...(measured
            ? { quantity: parsedQuantity, unitRate: parsedRate }
            : { amount: Number(amount) }),
        })
      }
      onClose()
    } catch (cause) {
      setError(isApiError(cause) ? cause.message : 'Could not save this cost.')
    }
  }

  const isSubmitting = create.isPending || update.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Correct this cost' : 'Record a cost'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {isEditing && expense.origin === 'system' && (
            <Alert severity="info">
              This cost was recorded by the system from a meter reading. It can be
              corrected — a mistyped reading has to be fixable after the fact.
            </Alert>
          )}

          {!isEditing && (
            <>
              <TextField
                select
                label="Building"
                fullWidth
                value={buildingId === '' ? '' : String(buildingId)}
                onChange={(event) => {
                  setBuildingId(event.target.value === '' ? '' : Number(event.target.value))
                  // A room belongs to one building, so changing the building
                  // leaves any chosen room pointing somewhere it is not.
                  setRoomId('')
                }}
              >
                {(buildingsQuery.data?.data ?? []).map((building) => (
                  <MenuItem key={building.id} value={String(building.id)}>
                    {building.displayName}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Room (optional)"
                fullWidth
                value={roomId === '' ? '' : String(roomId)}
                onChange={(event) =>
                  setRoomId(event.target.value === '' ? '' : Number(event.target.value))
                }
                helperText="Leave blank for a cost that belongs to the whole building"
              >
                <MenuItem value="">No particular room</MenuItem>
                {(roomsQuery.data?.data ?? []).map((room) => (
                  <MenuItem key={room.id} value={String(room.id)}>
                    {room.roomCode}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          <TextField
            select
            label="Kind"
            fullWidth
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
          >
            {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((key) => (
              <MenuItem key={key} value={key}>
                {CATEGORY_LABELS[key]}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="What it was for"
            fullWidth
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            helperText="Checked against a receipt months later — a kind and an amount alone cannot be"
          />

          <TextField
            label="Date it was incurred"
            type="date"
            fullWidth
            value={incurredAt}
            onChange={(event) => setIncurredAt(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {!isEditing && (
            <FormControlLabel
              control={
                <Switch
                  checked={measured}
                  onChange={(event) => setMeasured(event.target.checked)}
                />
              }
              label="This cost is measured (a quantity at a rate)"
            />
          )}

          {!isEditing && measured ? (
            <>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Quantity"
                  type="number"
                  fullWidth
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
                <TextField
                  label="Rate"
                  type="number"
                  fullWidth
                  value={unitRate}
                  onChange={(event) => setUnitRate(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, step: 'any' } }}
                />
              </Stack>
              {/*
                Shown, not entered. The amount follows from the two figures above
                and is computed by the API from them; offering a field for it
                here would invite a third number that disagrees with both.
              */}
              <Typography variant="body2" color="text.secondary">
                Amount: {derived === null ? '—' : formatMoney(derived)} (computed from
                the quantity and rate)
              </Typography>
            </>
          ) : (
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 1000 } }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !ready}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Saving…' : isEditing ? 'Save correction' : 'Record cost'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
