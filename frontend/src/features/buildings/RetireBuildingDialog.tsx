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
        setConflict(error.message)
        return
      }
      setOtherError(isApiError(error) ? error.message : 'Something went wrong.')
    }
  }

  return (
    <Dialog open={building !== null} onClose={retireMutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Retire building</DialogTitle>
      <DialogContent>
        {conflict && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <AlertTitle>Cannot retire this building yet</AlertTitle>
            {conflict}
          </Alert>
        )}
        {otherError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {otherError}
          </Alert>
        )}
        <DialogContentText>
          Retire <strong>{building?.displayName}</strong>? It will be hidden from
          the default list and from the location filters. Its rooms are not
          affected, and you can restore it at any time.
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
