import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { MoneyInput } from '@/components/MoneyField'
import { errorMessage } from '@/lib/error-messages'
import { useCreateServiceFee, useUpdateServiceFee } from '@/features/buildings/hooks'
import type { BuildingServiceFee, ServiceFeeBasis } from '@/features/buildings/types'

interface ServiceFeeFormDialogProps {
  open: boolean
  buildingId: number
  /** The fee being changed, or null to add one. */
  fee: BuildingServiceFee | null
  onClose: () => void
}

/**
 * Adding a service fee, or repricing one.
 *
 * Two fields, because the model has two. Quantity is NOT here: how many parking
 * spaces a particular tenant took is a fact about that tenancy, not about what
 * the building offers, and it is asked when the fee is attached.
 */
export function ServiceFeeFormDialog({ open, buildingId, fee, onClose }: ServiceFeeFormDialogProps) {
  const isEdit = fee !== null
  const createMutation = useCreateServiceFee(buildingId)
  const updateMutation = useUpdateServiceFee(buildingId)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [basis, setBasis] = useState<ServiceFeeBasis>('perRoom')
  const [tuAp, setTuAp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(fee?.name ?? '')
    setAmount(fee?.unitAmount)
    setBasis(fee?.basis ?? 'perRoom')
    setTuAp(fee?.appliedByDefault ?? false)
    setError(null)
  }, [open, fee])

  const ready = name.trim() !== '' && amount !== undefined && amount >= 0
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function submit() {
    setError(null)
    const input = { name: name.trim(), unitAmount: amount!, basis, appliedByDefault: tuAp }
    try {
      if (fee) {
        await updateMutation.mutateAsync({ feeId: fee.id, input })
      } else {
        await createMutation.mutateAsync(input)
      }
      onClose()
    } catch (cause) {
      // Stays open. The usual refusal is a name this building already uses,
      // and the fix is in the field the owner is looking at.
      setError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isEdit ? 'Sửa phí dịch vụ' : 'Thêm phí dịch vụ'}</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Những khoản thu hàng tháng ngoài tiền thuê, điện và nước — tiền rác, internet, giữ
          xe… Đặt ở đây rồi khi ký hợp đồng thì chọn ra.
        </DialogContentText>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Tên khoản thu"
            fullWidth
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            helperText="Tên này hiện trên hoá đơn của khách. Ví dụ: Tiền rác, Internet, Giữ xe"
          />
          <MoneyInput
            label="Giá mỗi tháng"
            value={amount}
            onChange={setAmount}
            unit="đ / tháng"
            helperText={
              isEdit
                ? 'Giá mới chỉ áp cho hợp đồng gắn phí này từ nay về sau. Hợp đồng đã gắn vẫn giữ giá cũ.'
                : basis === 'perPerson'
                  ? 'Giá cho MỘT người.'
                  : 'Giá cho một đơn vị. Hợp đồng giữ 2 xe thì tính gấp đôi.'
            }
          />

          {/*
            Nói bằng chuyện cái hoá đơn, không bằng chuyện mô hình dữ liệu:
            người đọc cần biết tiền thay đổi thế nào, không cần biết cột nào.
          */}
          <FormControl>
            <FormLabel id="basis-label">Tính theo</FormLabel>
            <RadioGroup
              aria-labelledby="basis-label"
              value={basis}
              onChange={(event) => setBasis(event.target.value as ServiceFeeBasis)}
            >
              <FormControlLabel
                value="perRoom"
                control={<Radio />}
                label="Phòng — thu như nhau, ở mấy người cũng vậy"
              />
              <FormControlLabel
                value="perPerson"
                control={<Radio />}
                label="Đầu người — nhân với số người ở, giống tiền nước"
              />
            </RadioGroup>
            {isEdit && (
              <Typography variant="caption" color="text.secondary">
                Đổi cách tính chỉ áp cho hợp đồng gắn phí này từ nay về sau.
              </Typography>
            )}
          </FormControl>

          <Box>
            <FormControlLabel
              control={<Switch checked={tuAp} onChange={(event) => setTuAp(event.target.checked)} />}
              label="Tự áp cho hợp đồng mới"
            />
            <Typography variant="caption" color="text.secondary" component="div">
              {tuAp
                ? 'Hợp đồng ký từ nay về sau ở toà này sẽ tự có khoản này. Hợp đồng đang chạy KHÔNG bị áp thêm.'
                : 'Bật lên thì hợp đồng ký sau này tự có khoản này, khỏi gắn từng cái.'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={!ready || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang lưu…' : isEdit ? 'Lưu' : 'Thêm phí dịch vụ'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
