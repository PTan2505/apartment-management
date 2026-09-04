import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { errorMessage } from '@/lib/error-messages'
import { formatDate } from '@/features/leases/dates'
import { useDepartOccupant } from '@/features/leases/hooks'
import type { Occupant } from '@/features/leases/types'

interface DepartOccupantDialogProps {
  /** The person leaving, or null when closed. */
  occupant: Occupant | null
  leaseId: number
  /** Everyone still living there, including the one departing. */
  currentOccupants: Occupant[]
  onClose: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * The earliest date this departure can carry, and the default.
 *
 * Nobody can leave before they arrived, and the API refuses it. Defaulting to
 * today looks harmless and is not: a tenancy that starts next month has
 * occupants who joined next month, so today is BEFORE they joined, and the
 * owner is handed a value the system will reject the moment they confirm it.
 * The refusal is handled and says why — but a default that is invalid on
 * arrival is a form arguing with itself.
 *
 * So the later of the two, and the same date bounds the input, so the picker
 * cannot offer an impossible day either.
 */
function earliestDeparture(joinedAt: string): string {
  const joined = joinedAt.slice(0, 10)
  const now = today()
  return joined > now ? joined : now
}

/**
 * Recording that somebody left — and, where they were the one responsible for
 * the agreement, passing that responsibility on.
 *
 * The API refuses to depart the responsible occupant while others remain: an
 * agreement cannot be left with nobody answerable for it. The obvious
 * implementation surfaces that refusal and stops. But this screen already knows
 * who the other occupants are, so a refusal here would be a screen that knows
 * exactly what to do and declines to do it.
 *
 * Where nobody else remains there is nobody to pass it to, and the departure is
 * simply accepted — leaving a tenancy that reports no tenant until a move-out
 * is recorded. That is a real state, not an error.
 */
export function DepartOccupantDialog({
  occupant,
  leaseId,
  currentOccupants,
  onClose,
}: DepartOccupantDialogProps) {
  const departMutation = useDepartOccupant()
  const [leftAt, setLeftAt] = useState(today())
  const [successorId, setSuccessorId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  const others = currentOccupants.filter((candidate) => candidate.id !== occupant?.id)
  // Responsibility only has to move when there is somebody to move it to.
  const mustTransfer = occupant?.isPrimary === true && others.length > 0

  useEffect(() => {
    if (!occupant) return
    setLeftAt(earliestDeparture(occupant.joinedAt))
    setError(null)
    // Pre-selected when there is only one candidate: with a single other
    // occupant the choice is not a choice, and asking for it is ceremony.
    setSuccessorId(others.length === 1 ? others[0]!.customerId : '')
    // `others` is derived from the props this runs on; recomputing it here
    // would loop on a new array identity every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [occupant])

  async function handleConfirm() {
    if (!occupant) return
    setError(null)
    try {
      await departMutation.mutateAsync({
        leaseId,
        occupantId: occupant.id,
        leftAt,
        transferTo: mustTransfer ? Number(successorId) : undefined,
      })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  const name = occupant?.fullName ?? 'this person'
  const isSubmitting = departMutation.isPending
  const blocked = mustTransfer && successorId === ''

  return (
    <Dialog open={occupant !== null} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Ghi nhận rời đi</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            {name} will be shown as having left. They stay listed on this
            hợp đồng — ai từng ở và ở khi nào chính là thứ hồ sơ này cần lưu.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Ngày rời đi"
            type="date"
            fullWidth
            value={leftAt}
            onChange={(event) => setLeftAt(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              // Bounds the picker at the day they joined, so an impossible date
              // is not offered in the first place.
              htmlInput: occupant ? { min: occupant.joinedAt.slice(0, 10) } : undefined,
            }}
            helperText={
              occupant ? `Not before ${formatDate(occupant.joinedAt)}, when they joined` : undefined
            }
          />

          {mustTransfer && (
            <>
              <Alert severity="info">
                <AlertTitle>Phải có người nhận thay</AlertTitle>
                {name} is responsible for this agreement, and other people still
                còn ở đây. Chuyển người đứng tên trước, rồi mới ghi nhận
                recorded.
              </Alert>
              <TextField
                select
                label="Người nhận đứng tên"
                fullWidth
                value={successorId === '' ? '' : String(successorId)}
                onChange={(event) => setSuccessorId(Number(event.target.value))}
              >
                {others.map((candidate) => (
                  <MenuItem key={candidate.id} value={String(candidate.customerId)}>
                    {candidate.fullName ?? `Customer #${candidate.customerId}`}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          {occupant?.isPrimary === true && others.length === 0 && (
            <Alert severity="warning">
              <AlertTitle>Không còn ai để nhận thay</AlertTitle>
              Hợp đồng sẽ không có người đứng tên cho tới khi ghi nhận trả phòng.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Huỷ
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || blocked}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang ghi…' : 'Ghi nhận rời đi'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
