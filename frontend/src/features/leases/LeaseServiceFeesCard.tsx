import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { formatDate } from '@/features/leases/dates'
import { useBuildingServiceFees } from '@/features/buildings/hooks'
import {
  useEndLeaseServiceFee,
  useLeaseServiceFees,
  useSelectLeaseServiceFee,
  useUpdateLeaseServiceFeeQuantity,
} from '@/features/leases/hooks'
import type { Lease } from '@/features/leases/types'
import type { LeaseServiceFee } from '@/features/leases/api'

function today() {
  return new Date().toISOString().slice(0, 10)
}

/** Adding a fee to this tenancy, or changing how many of it. */
function AddFeeDialog({
  open,
  lease,
  onClose,
}: {
  open: boolean
  lease: Lease
  onClose: () => void
}) {
  // Only what the building still offers: the API refuses a retired one, and a
  // choice that will be refused is not a choice.
  const catalogueQuery = useBuildingServiceFees(lease.room?.building?.id, open)
  const selectMutation = useSelectLeaseServiceFee(lease.id)
  const [feeId, setFeeId] = useState<number | ''>('')
  const [quantity, setQuantity] = useState('1')
  /*
    Ngày áp dụng là một LỰA CHỌN, không có mặc định ngầm.

    API mặc định lùi về ngày hợp đồng bắt đầu — đúng cho khoản đã thoả thuận
    lúc ký mà nhập muộn, và sai lặng lẽ cho khoản mới thoả thuận giữa chừng:
    tháng nào chưa chốt sổ, kể cả tháng trước khi khách đồng ý, đều bị thu đủ.
    Bắt chọn thì không rơi vào vế nào một cách tình cờ.
  */
  const [batDau, setBatDau] = useState<'' | 'leaseStart' | 'date'>('')
  const [from, setFrom] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFeeId('')
    setQuantity('1')
    setBatDau('')
    setFrom('')
    setError(null)
  }, [open])

  const catalogue = (catalogueQuery.data ?? []).filter((fee) => fee.isActive)
  const chosen = catalogue.find((fee) => fee.id === feeId)
  const theoDauNguoi = chosen?.basis === 'perPerson'
  // Số người ở của hợp đồng là số nhân cho khoản theo đầu người.
  const soNhan = theoDauNguoi ? lease.occupantCount : Number(quantity)
  const soLuongHopLe = theoDauNguoi || (Number.isInteger(Number(quantity)) && Number(quantity) >= 1)
  const ngayHopLe = batDau === 'leaseStart' || (batDau === 'date' && from !== '')
  const ready = feeId !== '' && soLuongHopLe && ngayHopLe

  return (
    <Dialog open={open} onClose={selectMutation.isPending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Thêm phí dịch vụ vào hợp đồng</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Chọn từ danh mục của toà nhà. Từ đây mỗi lần chốt sổ, khoản này tự cộng vào hoá
          đơn của hợp đồng.
        </DialogContentText>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {catalogue.length === 0 && !catalogueQuery.isPending && (
            <Alert severity="info">
              Toà nhà này chưa có khoản thu nào. Vào trang toà nhà để thêm trước.
            </Alert>
          )}
          <TextField
            select
            label="Khoản thu"
            fullWidth
            value={feeId === '' ? '' : String(feeId)}
            onChange={(event) => setFeeId(Number(event.target.value))}
            disabled={catalogue.length === 0}
            helperText={catalogueQuery.isPending ? 'Đang tải danh mục…' : 'Theo danh mục của toà nhà'}
          >
            {catalogue.map((fee) => (
              <MenuItem key={fee.id} value={String(fee.id)}>
                {fee.name} · {formatMoney(fee.unitAmount)} / tháng
              </MenuItem>
            ))}
          </TextField>
          {/*
            Khoản theo đầu người không hỏi số lượng: số người ở của hợp đồng
            chính là số nhân, hỏi thêm một con số nữa là để hai số cãi nhau —
            và API cũng từ chối.
          */}
          {theoDauNguoi ? (
            <Alert severity="info" icon={false}>
              Khoản này tính theo đầu người, nhân với số người ở của hợp đồng —
              hiện là <strong>{lease.occupantCount} người</strong>. Thêm hay bớt người thì tháng
              sau tự đổi theo.
            </Alert>
          ) : (
            <TextField
              label="Số lượng"
              type="number"
              fullWidth
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              helperText="Ví dụ 2 nếu khách giữ hai xe. Để 1 cho khoản khoán như internet."
            />
          )}

          <FormControl>
            <FormLabel id="batdau-label">Áp dụng từ</FormLabel>
            <RadioGroup
              aria-labelledby="batdau-label"
              value={batDau}
              onChange={(event) => setBatDau(event.target.value as 'leaseStart' | 'date')}
            >
              <FormControlLabel
                value="leaseStart"
                control={<Radio />}
                label={`Đầu hợp đồng (${formatDate(lease.startDate)}) — đã thoả thuận lúc ký, giờ mới nhập`}
              />
              <FormControlLabel
                value="date"
                control={<Radio />}
                label="Từ một ngày cụ thể — mới thoả thuận thêm với khách"
              />
            </RadioGroup>
          </FormControl>
          {batDau === 'date' && (
            <TextField
              label="Từ ngày"
              type="date"
              fullWidth
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText="Tháng có ngày này sẽ chỉ thu phần từ ngày đó trở đi."
            />
          )}
          {/*
            Hoá đơn đã phát hành không tự sửa. Nói ra ngay lúc chọn ngày lùi,
            chứ không để chủ nhà ngồi chờ một khoản điều chỉnh không bao giờ tới.
          */}
          {batDau === 'leaseStart' && (
            <Typography variant="caption" color="text.secondary">
              Những tháng chưa chốt sổ sẽ bị thu khoản này. Hoá đơn đã phát hành không tự sửa.
            </Typography>
          )}
          {chosen && (
            <Typography variant="body2">
              Mỗi tháng:{' '}
              <strong>
                {formatMoney(chosen.unitAmount * (Number.isFinite(soNhan) ? soNhan : 0))}
              </strong>
              {theoDauNguoi && ` (${formatMoney(chosen.unitAmount)} × ${lease.occupantCount} người)`}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={selectMutation.isPending}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          disabled={!ready || selectMutation.isPending}
          startIcon={selectMutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={async () => {
            setError(null)
            try {
              await selectMutation.mutateAsync({
                buildingServiceFeeId: Number(feeId),
                // Không gửi số lượng cho khoản theo đầu người — API từ chối.
                ...(theoDauNguoi ? {} : { quantity: Number(quantity) }),
                ...(batDau === 'date' ? { effectiveFrom: from } : {}),
              })
              onClose()
            } catch (cause) {
              setError(errorMessage(cause))
            }
          }}
        >
          {selectMutation.isPending ? 'Đang thêm…' : 'Thêm vào hợp đồng'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

/**
 * The fees this tenancy is billed for every month, and the controls over them.
 *
 * This is the half that reaches money. The building's catalogue only says what
 * is ON OFFER; nothing is charged until a tenancy takes it up here, and from
 * then on closing a month adds it to that month's invoice, prorated where the
 * fee started or stopped partway through.
 */
export function LeaseServiceFeesCard({ lease }: { lease: Lease }) {
  const feesQuery = useLeaseServiceFees(lease.id)
  const quantityMutation = useUpdateLeaseServiceFeeQuantity(lease.id)
  const endMutation = useEndLeaseServiceFee(lease.id)
  const [addOpen, setAddOpen] = useState(false)
  const [ending, setEnding] = useState<LeaseServiceFee | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fees = feesQuery.data ?? []
  const dangTinh = fees.filter((fee) => fee.effectiveTo === null)
  const daNgung = fees.filter((fee) => fee.effectiveTo !== null)
  /*
    monthlyAmount của API là giá cho MỘT người với khoản theo đầu người — số
    người là chuyện của hợp đồng và được đọc lại mỗi lần chốt sổ. Nhân ở đây
    để con số trên màn khớp với con số sẽ lên hoá đơn.
  */
  const thangCuaKhoan = (fee: LeaseServiceFee) =>
    fee.basis === 'perPerson' ? fee.unitAmount * lease.occupantCount : fee.monthlyAmount
  const moiThang = dangTinh.reduce((tong, fee) => tong + thangCuaKhoan(fee), 0)

  // A finished tenancy takes no new fees: nothing further will be billed, and
  // the API would refuse. Its history stays readable.
  const dangChay = lease.moveOutDate === null && lease.cancelledAt === null

  return (
    <Card variant="outlined">
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            mb: 0.5,
          }}
        >
          <Typography variant="h6" component="h3">
            Phí dịch vụ hàng tháng
          </Typography>
          {dangChay && (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
              Thêm phí dịch vụ
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        {feesQuery.isPending ? (
          <Typography variant="body2" color="text.secondary">
            Đang tải…
          </Typography>
        ) : fees.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Hợp đồng này chỉ có tiền thuê, điện và nước. Thêm khoản thu nếu khách dùng thêm
            dịch vụ nào.
          </Typography>
        ) : (
          <Stack divider={<Divider />}>
            {dangTinh.map((fee) => (
              <Box
                key={fee.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  py: 1,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {fee.name ?? 'Khoản thu đã xoá'}
                    {fee.basis === 'perPerson'
                      ? ` × ${lease.occupantCount} người`
                      : fee.quantity > 1 && ` × ${fee.quantity}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatMoney(thangCuaKhoan(fee))} / tháng · từ {formatDate(fee.effectiveFrom)}
                    {fee.basis === 'perPerson' &&
                      ` · ${formatMoney(fee.unitAmount)} mỗi người, theo số người ở`}
                    {/*
                      The building may have retired it since. This tenancy keeps
                      being charged — it holds its own agreed amount — so this
                      says something about the catalogue, not about the bill.
                    */}
                    {fee.isOfferedByBuilding === false && ' · toà đã ngưng khoản này'}
                  </Typography>
                </Box>
                {dangChay && (
                  <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0, alignItems: 'center' }}>
                    {/*
                      Khoản theo đầu người không có ô số lượng: số người ở quyết
                      định, và một ô thứ hai sẽ ngụ ý ngược lại. Sửa số người ở
                      thẻ ngay bên dưới.
                    */}
                    {fee.basis !== 'perPerson' && (
                    <TextField
                      size="small"
                      type="number"
                      // Viết đủ chữ. "SL" tiết kiệm được vài pixel và bắt
                      // người đọc đoán, trong khi ô này quyết định tiền.
                      label="Số lượng"
                      defaultValue={fee.quantity}
                      sx={{ width: 118 }}
                      slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      onBlur={async (event) => {
                        const moi = Number(event.target.value)
                        if (!Number.isInteger(moi) || moi < 1 || moi === fee.quantity) return
                        setError(null)
                        try {
                          await quantityMutation.mutateAsync({ selectionId: fee.id, quantity: moi })
                        } catch (cause) {
                          setError(errorMessage(cause))
                        }
                      }}
                    />
                    )}
                    <Button size="small" color="warning" onClick={() => setEnding(fee)}>
                      Ngừng
                    </Button>
                  </Stack>
                )}
              </Box>
            ))}

            {daNgung.length > 0 && (
              <Box sx={{ pt: 1.5 }}>
                <Typography variant="overline" color="text.secondary" component="div">
                  Đã ngừng
                </Typography>
                {daNgung.map((fee) => (
                  <Typography key={fee.id} variant="body2" color="text.secondary">
                    {fee.name ?? 'Khoản thu đã xoá'} · {formatMoney(thangCuaKhoan(fee))} / tháng ·{' '}
                    {formatDate(fee.effectiveFrom)} → {formatDate(fee.effectiveTo!)}
                  </Typography>
                ))}
              </Box>
            )}
          </Stack>
        )}

        {dangTinh.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Chip
              color="primary"
              variant="outlined"
              label={`Mỗi tháng cộng thêm ${formatMoney(moiThang)}`}
            />
          </Box>
        )}
      </CardContent>

      <AddFeeDialog open={addOpen} lease={lease} onClose={() => setAddOpen(false)} />

      <ConfirmDialog
        open={ending !== null}
        title="Ngừng khoản thu này trên hợp đồng?"
        description={
          ending
            ? `"${ending.name}" sẽ thôi được cộng vào hoá đơn kể từ hôm nay (${formatDate(today())}). Những tháng đã tính vẫn giữ nguyên.`
            : ''
        }
        confirmLabel="Ngừng khoản thu"
        busyLabel="Đang ngừng…"
        busy={endMutation.isPending}
        onClose={() => setEnding(null)}
        onConfirm={async () => {
          setError(null)
          try {
            await endMutation.mutateAsync({ selectionId: ending!.id, effectiveTo: today() })
            setEnding(null)
          } catch (cause) {
            setEnding(null)
            setError(errorMessage(cause))
          }
        }}
      />
    </Card>
  )
}
