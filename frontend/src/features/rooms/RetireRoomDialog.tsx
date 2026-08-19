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

import { isApiError } from '@/lib/api-error'
import { useRetireRoom } from '@/features/rooms/hooks'
import type { Room } from '@/features/rooms/types'

interface RetireRoomDialogProps {
  room: Room | null
  onClose: () => void
}

/**
 * Retiring is confirmed because a retired room leaves the default list and
 * frees its code for reuse. Restoring is not — but it can still be refused, so
 * that refusal is surfaced where it happens rather than here.
 */
export function RetireRoomDialog({ room, onClose }: RetireRoomDialogProps) {
  const retireMutation = useRetireRoom()
  const [conflict, setConflict] = useState<string | null>(null)
  const [otherError, setOtherError] = useState<string | null>(null)

  useEffect(() => {
    if (room) {
      setConflict(null)
      setOtherError(null)
    }
  }, [room])

  async function handleRetire() {
    if (!room) return
    setConflict(null)
    setOtherError(null)
    try {
      await retireMutation.mutateAsync(room.id)
      onClose()
    } catch (error) {
      // A room with a tenant in it cannot be taken out of service. That is an
      // expected outcome of a reasonable action, and the API's message names
      // the reason better than this screen could.
      if (isApiError(error) && error.isConflict) {
        setConflict(error.message)
        return
      }
      setOtherError(isApiError(error) ? error.message : 'Something went wrong.')
    }
  }

  return (
    <Dialog open={room !== null} onClose={retireMutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Retire room</DialogTitle>
      <DialogContent>
        {conflict && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Cannot retire this room yet</AlertTitle>
            {conflict}
          </Alert>
        )}
        {otherError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otherError}
          </Alert>
        )}
        <DialogContentText>
          Retire <strong>{room?.roomCode}</strong> in {room?.building.displayName}? It
          will be hidden from the default list, and its code becomes available for
          a new room. You can restore it later, unless the code has been taken.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={retireMutation.isPending}>
          Cancel
        </Button>
        <Button
          color="warning"
          variant="contained"
          onClick={handleRetire}
          disabled={retireMutation.isPending || conflict !== null}
          startIcon={retireMutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {retireMutation.isPending ? 'Retiring…' : 'Retire'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
