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
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'

import { MoneyInput } from '@/components/MoneyField'
import { errorMessage } from '@/lib/error-messages'
import { useCreateFurnitureItem, useUpdateFurnitureItem } from '@/features/furniture/hooks'
import type { FurnitureItem } from '@/features/furniture/types'

/**
 * Adding or correcting one entry in a building's furniture catalogue.
 *
 * Says out loud that an entry here furnishes nobody — a room has to hold it.
 * The same two-level split as service fees, and the same place people get it
 * wrong: a catalogue that looks complete and equips no room at all.
 */
export function FurnitureItemDialog({
  open,
  buildingId,
  item,
  onClose,
}: {
  open: boolean
  buildingId: number
  /** Null to add a new entry. */
  item: FurnitureItem | null
  onClose: () => void
}) {
  const create = useCreateFurnitureItem(buildingId)
  const update = useUpdateFurnitureItem(buildingId)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('')
  const [make, setMake] = useState('')
  const [unitValue, setUnitValue] = useState<number | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(item?.name ?? '')
    setKind(item?.kind ?? '')
    setMake(item?.make ?? '')
    setUnitValue(item?.unitValue)
    setError(null)
  }, [open, item])

  const busy = create.isPending || update.isPending
  const ready = name.trim() !== '' && kind.trim() !== '' && unitValue !== undefined && unitValue >= 0

  async function submit() {
    setError(null)
    const input = {
      name: name.trim(),
      kind: kind.trim(),
      make: make.trim() === '' ? undefined : make.trim(),
      unitValue: unitValue!,
    }
    try {
      if (item === null) await create.mutateAsync(input)
      else await update.mutateAsync({ id: item.id, input })
      onClose()
    } catch (cause) {
      // Stays open: a rejected name is worth correcting, not retyping.
      setError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{item === null ? 'Thêm món nội thất' : 'Sửa món nội thất'}</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Đặt ở đây là để <strong>chọn ra khi trang bị cho phòng</strong> — bản thân nó
          chưa trang bị cho phòng nào cả.
        </DialogContentText>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Tên món"
            required
            fullWidth
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            helperText="Ví dụ: Giường gỗ 1m6. Không trùng với món đang dùng khác trong toà."
          />
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Loại"
              required
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              sx={{ flex: '1 1 140px' }}
              helperText="giường, tủ lạnh, máy lạnh…"
            />
            <TextField
              label="Hãng"
              value={make}
              onChange={(event) => setMake(event.target.value)}
              sx={{ flex: '1 1 140px' }}
              helperText="Không bắt buộc."
            />
          </Box>
          <MoneyInput
            label="Giá trị một cái"
            value={unitValue}
            onChange={setUnitValue}
            unit="đ"
            helperText={
              item === null
                ? 'Dùng làm mức khởi điểm khi tính tiền hư hỏng.'
                : 'Đổi giá chỉ ảnh hưởng phòng trang bị SAU này. Phòng đã trang bị giữ nguyên giá cũ.'
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          disabled={!ready || busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() => void submit()}
        >
          {busy ? 'Đang lưu…' : item === null ? 'Thêm' : 'Lưu'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
