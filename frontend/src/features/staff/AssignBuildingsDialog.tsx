import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { errorMessage } from '@/lib/error-messages'
import { useBuildings } from '@/features/buildings/hooks'
import { useAssignBuildings } from '@/features/staff/hooks'
import type { Staff } from '@/features/staff/types'

/**
 * Which buildings somebody covers — the whole set, not an addition.
 *
 * Unticking is how a building is taken away, so what is on screen when it is
 * saved is exactly what that person will see afterwards. A partial update
 * would make "these are the buildings they cover" a claim the screen could not
 * make from one request.
 */
export function AssignBuildingsDialog({
  staff,
  onClose,
}: {
  staff: Staff | null
  onClose: () => void
}) {
  const [selected, setSelected] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const buildings = useBuildings({ pageSize: 200 })
  const assign = useAssignBuildings()

  useEffect(() => {
    if (staff) setSelected(staff.buildings.map((building) => building.id))
    setError(null)
  }, [staff])

  async function submit() {
    if (!staff) return
    setError(null)
    try {
      await assign.mutateAsync({ id: staff.id, buildingIds: selected })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <ConfirmDialog
      open={staff !== null}
      title={`Toà nhà ${staff?.fullName ?? ''} phụ trách`}
      description="Bỏ chọn một toà là lấy lại quyền xem toà đó. Nhân viên thấy thay đổi ngay, không cần đăng nhập lại."
      confirmLabel="Lưu"
      busyLabel="Đang lưu…"
      busy={assign.isPending}
      error={error}
      onConfirm={() => void submit()}
      onClose={onClose}
    >
      {buildings.isPending ? (
        <CircularProgress size={20} />
      ) : (
        <Stack sx={{ maxHeight: 280, overflowY: 'auto' }}>
          {(buildings.data?.data ?? []).map((building) => (
            <FormControlLabel
              key={building.id}
              control={
                <Checkbox
                  checked={selected.includes(building.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, building.id]
                        : current.filter((id) => id !== building.id),
                    )
                  }
                />
              }
              label={building.displayName}
            />
          ))}
        </Stack>
      )}

      {selected.length === 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          Không chọn toà nào thì nhân viên này đăng nhập vào sẽ không thấy gì cả.
        </Alert>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
        Đang chọn {selected.length} toà.
      </Typography>
    </ConfirmDialog>
  )
}
