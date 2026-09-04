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
import { useRetireBuilding } from '@/features/buildings/hooks'
import type { Building } from '@/features/buildings/types'

interface RetireBuildingDialogProps {
  building: Building | null
  onClose: () => void
}

/**
 * Retiring is confirmed because a retired building leaves the default list and
 * the location filter choices — easy to do by accident, and not obvious that it
 * happened. Restoring is not confirmed anywhere: it is not destructive and its
 * effect is immediately visible.
 */
export function RetireBuildingDialog({ building, onClose }: RetireBuildingDialogProps) {
  const retireMutation = useRetireBuilding()
  const [conflict, setConflict] = useState<string | null>(null)
  const [otherError, setOtherError] = useState<string | null>(null)

  useEffect(() => {
    if (building) {
      setConflict(null)
      setOtherError(null)
    }
  }, [building])

  async function handleRetire() {
    if (!building) return
    setConflict(null)
    setOtherError(null)
    try {
      await retireMutation.mutateAsync(building.id)
      onClose()
    } catch (error) {
      // A refusal because a room still has a tenant is an expected outcome of a
      // reasonable action, not a fault — and the API's message names the reason
      // better than anything this screen could invent.
      if (isApiError(error) && error.isConflict) {
        setConflict(errorMessage(error))
        return
      }
      setOtherError(errorMessage(error))
    }
  }

  return (
    <Dialog open={building !== null} onClose={retireMutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Ngừng sử dụng toà nhà</DialogTitle>
      <DialogContent>
        {conflict && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Chưa thể ngừng toà nhà này</AlertTitle>
            {conflict}
          </Alert>
        )}
        {otherError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otherError}
          </Alert>
        )}
        <DialogContentText>
          Ngừng sử dụng <strong>{building?.displayName}</strong>? Toà nhà sẽ được ẩn khỏi
          danh sách mặc định và khỏi bộ lọc vị trí. Các phòng bên trong không bị
          ảnh hưởng, và bạn có thể dùng lại bất cứ lúc nào.
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
