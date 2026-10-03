import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
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
import { formatMoney } from '@/lib/format'
import { FURNITURE_CONDITIONS, conditionLabel } from '@/features/furniture/labels'
import { useAddRoomFurniture, useFurnitureCatalogue } from '@/features/furniture/hooks'
import type { FurnitureCondition } from '@/features/furniture/types'

/**
 * Putting a catalogue entry into a room.
 *
 * The price is NOT asked for: it is copied from the catalogue at this moment,
 * and the dialog says so. Letting it be typed here would make "what the
 * building paid" and "what this room is worth" drift apart silently, and the
 * second is what a departing tenant gets charged against.
 */
export function AddRoomFurnitureDialog({
  open,
  roomId,
  buildingId,
  onClose,
}: {
  open: boolean
  roomId: number
  buildingId: number
  onClose: () => void
}) {
  const catalogue = useFurnitureCatalogue(buildingId)
  const add = useAddRoomFurniture(roomId)
  const [itemId, setItemId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [condition, setCondition] = useState<FurnitureCondition>('good')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setItemId('')
    setQuantity('1')
    setCondition('good')
    setNote('')
    setError(null)
  }, [open])

  const items = catalogue.data?.data ?? []
  const chosen = items.find((item) => String(item.id) === itemId)
  const soLuong = Number(quantity)
  const ready = chosen !== undefined && Number.isInteger(soLuong) && soLuong > 0

  async function submit() {
    setError(null)
    try {
      await add.mutateAsync({
        furnitureItemId: chosen!.id,
        quantity: soLuong,
        condition,
        note: note.trim() === '' ? undefined : note.trim(),
      })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onClose={add.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thêm đồ vào phòng</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Chọn từ danh mục của toà. Giá trị được{' '}
          <strong>chép lại ngay lúc này</strong> — sau này toà đổi giá thì phòng vẫn giữ
          giá cũ.
        </DialogContentText>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {catalogue.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : items.length === 0 ? (
            <Alert severity="info">
              Toà này chưa khai món nội thất nào. Vào trang toà nhà thêm trước đã.
            </Alert>
          ) : (
            <TextField
              select
              label="Món"
              required
              fullWidth
              value={itemId}
              onChange={(event) => setItemId(event.target.value)}
            >
              {items.map((item) => (
                <MenuItem key={item.id} value={String(item.id)}>
                  {item.name} · {formatMoney(item.unitValue)}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Số lượng"
              type="number"
              required
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              slotProps={{ htmlInput: { min: 1 } }}
              sx={{ flex: '1 1 120px' }}
            />
            <TextField
              select
              label="Tình trạng"
              required
              value={condition}
              onChange={(event) => setCondition(event.target.value as FurnitureCondition)}
              sx={{ flex: '1 1 140px' }}
            >
              {FURNITURE_CONDITIONS.map((value) => (
                <MenuItem key={value} value={value}>
                  {conditionLabel(value)}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Ghi chú"
            fullWidth
            value={note}
            onChange={(event) => setNote(event.target.value)}
            helperText="Ví dụ: xước ở cạnh bên phải."
          />

          {chosen && (
            <Alert severity="info" icon={false}>
              Tổng giá trị ghi vào phòng:{' '}
              <strong>{formatMoney(chosen.unitValue * (soLuong > 0 ? soLuong : 0))}</strong>
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={add.isPending}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          disabled={!ready || add.isPending}
          startIcon={add.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() => void submit()}
        >
          {add.isPending ? 'Đang thêm…' : 'Thêm'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
