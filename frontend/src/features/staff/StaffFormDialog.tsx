import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { errorMessage } from '@/lib/error-messages'
import { useBuildings } from '@/features/buildings/hooks'
import { useCreateStaff } from '@/features/staff/hooks'
import type { Staff, StaffWithPassword } from '@/features/staff/types'

/**
 * Creating a staff account: a name, a phone number, a role, and which
 * buildings they cover.
 *
 * No password field. One the owner chooses is one they will reuse across
 * employees, and one the system can show them later is one it is keeping in
 * readable form — so the system generates it and shows it once.
 */
export function StaffFormDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (result: StaffWithPassword) => void
}) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Staff['role']>('manager')
  const [buildingIds, setBuildingIds] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)

  const buildings = useBuildings({ pageSize: 200 })
  const create = useCreateStaff()

  useEffect(() => {
    if (!open) return
    setFullName('')
    setPhone('')
    setRole('manager')
    setBuildingIds([])
    setError(null)
  }, [open])

  const ready = fullName.trim() !== '' && phone.trim() !== ''

  async function submit() {
    setError(null)
    try {
      const result = await create.mutateAsync({
        fullName: fullName.trim(),
        phone: phone.trim(),
        role,
        buildingIds,
      })
      onCreated(result)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onClose={create.isPending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Thêm nhân viên</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <DialogContentText>
            Nhân viên đăng nhập bằng số điện thoại. Mật khẩu do hệ thống sinh và chỉ hiện
            một lần sau khi tạo.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Họ tên"
              fullWidth
              autoFocus
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <TextField
              label="Số điện thoại"
              fullWidth
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              helperText="Dùng để đăng nhập"
            />
          </Stack>

          <TextField
            select
            label="Vai trò"
            value={role}
            onChange={(event) => setRole(event.target.value as Staff['role'])}
            helperText={
              role === 'manager'
                ? 'Quản lí: vận hành các toà được giao — ký hợp đồng, chốt sổ hàng tháng, ghi chi phí. Không đặt giá, không sửa hợp đồng đã ký, không ghi nhận thanh toán, không xem doanh thu.'
                : 'Bảo trì: chỉ thấy danh sách báo hỏng của các toà được giao.'
            }
          >
            <MenuItem value="manager">Quản lí</MenuItem>
            <MenuItem value="maintenance">Bảo trì</MenuItem>
          </TextField>

          <div>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Toà nhà phụ trách
            </Typography>
            {/*
              Optional here, and said so: an owner may create the account now
              and decide the buildings later. Until they do, that person signs
              in and sees nothing — which the list screen states rather than
              leaving as an empty screen nobody can explain.
            */}
            <Typography variant="caption" color="text.secondary">
              Có thể giao sau. Chưa giao toà nào thì nhân viên đăng nhập vào sẽ không thấy gì.
            </Typography>
            <Stack sx={{ mt: 1, maxHeight: 220, overflowY: 'auto' }}>
              {buildings.isPending ? (
                <CircularProgress size={20} />
              ) : (
                (buildings.data?.data ?? []).map((building) => (
                  <FormControlLabel
                    key={building.id}
                    control={
                      <Checkbox
                        checked={buildingIds.includes(building.id)}
                        onChange={(event) =>
                          setBuildingIds((current) =>
                            event.target.checked
                              ? [...current, building.id]
                              : current.filter((id) => id !== building.id),
                          )
                        }
                      />
                    }
                    label={building.displayName}
                  />
                ))
              )}
            </Stack>
          </div>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={create.isPending}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={() => void submit()}
          disabled={!ready || create.isPending}
          startIcon={create.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {create.isPending ? 'Đang tạo…' : 'Tạo tài khoản'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
