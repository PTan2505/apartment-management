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
import { errorMessage } from '@/lib/error-messages'
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
        setConflict(errorMessage(error))
        return
      }
      setOtherError(errorMessage(error))
    }
  }

  return (
    <Dialog open={room !== null} onClose={retireMutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Ngừng sử dụng phòng</DialogTitle>
      <DialogContent>
        {conflict && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Chưa thể ngừng phòng này</AlertTitle>
            {conflict}
          </Alert>
        )}
        {otherError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otherError}
          </Alert>
        )}
        <DialogContentText>
          Ngừng sử dụng <strong>{room?.roomCode}</strong> ở {room?.building.displayName}? Phòng
          sẽ bị ẩn khỏi danh sách mặc định, và mã phòng được dùng lại cho
          phòng mới. Bạn có thể dùng lại sau, trừ khi mã đã bị chiếm.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={retireMutation.isPending}>
          Huỷ
        </Button>
        <Button
          color="warning"
          variant="contained"
          onClick={handleRetire}
          disabled={retireMutation.isPending || conflict !== null}
          startIcon={retireMutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {retireMutation.isPending ? 'Đang ngừng…' : 'Ngừng sử dụng'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
