import { useEffect, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MoneyInput } from '@/components/MoneyField'
import { errorMessage } from '@/lib/error-messages'
import { formatCoveredThrough, formatDate } from '@/features/leases/dates'
import { useRecordMoveOut } from '@/features/leases/hooks'
// Danh mục là của TOÀ NHÀ; hộp này chỉ mượn tên khoản thu từ đó.
import { useBuildingServiceFees } from '@/features/buildings/hooks'
import { UnpaidInvoicesWarning } from '@/features/leases/UnpaidInvoicesWarning'
import { useRoomMeterReading } from '@/features/rooms/hooks'
import type { Lease } from '@/features/leases/types'

interface MoveOutDialogProps {
  open: boolean
  lease: Lease
  onClose: () => void
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** A charge for days nobody agreed on: a fee's name, an amount of the owner's own. */
interface KhoanQuaHan {
  buildingServiceFeeId: number | ''
  amount: number | undefined
}

/**
 * Closing a tenancy that actually happened.
 *
 * ── Why this is not cancelling ──────────────────────────────────────────────
 *
 * Cancelling records a tenancy as never having taken place. Used on a tenant
 * who lived somewhere for a year it would erase the year. This is the other
 * ending: somebody lived here, they have gone, and the month they were here
 * still has to be billed.
 *
 * ── Why the reading is typed, not defaulted ─────────────────────────────────
 *
 * It decides the final bill, and it is the one figure in this dialog nobody can
 * check afterwards. A default would be accepted without being read. The room's
 * last known reading is shown BESIDE the field instead, so the owner can see
 * what they are continuing from.
 *
 * ── Why the overdue rows appear late ────────────────────────────────────────
 *
 * They are offered only when the date entered is after the agreed end, because
 * that is when the days exist. The API ignores them otherwise, and asking every
 * owner to consider a case that applies to few of them is how a dialog becomes
 * something people click through.
 */
export function MoveOutDialog({ open, lease, onClose }: MoveOutDialogProps) {
  const moveOutMutation = useRecordMoveOut()
  const meterQuery = useRoomMeterReading(open ? lease.roomId : undefined)
  const [leftOn, setLeftOn] = useState(today())
  const [reading, setReading] = useState('')
  const [charges, setCharges] = useState<KhoanQuaHan[]>([])
  const [error, setError] = useState<string | null>(null)

  // Late departures only: the days beyond the term are what these charge for.
  const late = leftOn > lease.expectedEndDate.slice(0, 10)
  const feesQuery = useBuildingServiceFees(lease.room?.building?.id, open && late)

  useEffect(() => {
    if (!open) return
    setLeftOn(today())
    setReading('')
    // Số thật tới sau, ở effect bên dưới, khi phòng trả lời.
    setCharges([])
    setError(null)
  }, [open])

  /*
    Điền sẵn số cũ, thay vì để trống.

    Trước đây ô này CỐ Ý để trống: nó quyết định hoá đơn cuối, là con số duy
    nhất trên hình không ai kiểm lại được sau đó, và một giá trị điền sẵn thì
    rất dễ bị bấm qua mà không ai ra xem công tơ. Chủ nhà chọn đổi lại cho
    đồng bộ với mọi ô khác — đánh đổi là nếu không ai sửa thì hoá đơn ra 0 kWh
    tiền điện, khách không phàn nàn, và tiền mất âm thầm.
  */
  const daDienSan = useRef(false)
  useEffect(() => {
    if (!open) {
      daDienSan.current = false
      return
    }
    if (daDienSan.current) return
    const cu = lease.lastInvoicedMeterReading ?? meterQuery.data?.reading
    if (cu === null || cu === undefined) return
    daDienSan.current = true
    setReading(String(cu))
  }, [open, lease.lastInvoicedMeterReading, meterQuery.data])

  const soDien = Number(reading)
  /*
    The floor this tenancy's own bills have already established. Checked here as
    well as by the API — not instead of it: a refusal that arrives after the
    request is a refusal that arrives after the owner has committed, and this
    one is knowable while they are still typing.
  */
  const sanToiThieu = lease.lastInvoicedMeterReading
  const quaThap =
    sanToiThieu !== null && reading.trim() !== '' && Number.isFinite(soDien) && soDien < sanToiThieu
  const ready =
    reading.trim() !== '' && Number.isFinite(soDien) && soDien >= 0 && leftOn !== '' && !quaThap

  /*
    The question asked between filling the form in and the tenancy actually
    closing. Recording a move-out issues the final bill and hands the room
    back; neither is undone by this screen.
  */
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleConfirm() {
    setError(null)
    try {
      await moveOutMutation.mutateAsync({
        id: lease.id,
        input: {
          moveOutDate: leftOn,
          endMeterReading: soDien,
          // Only complete rows are sent. A half-filled row is an owner who was
          // interrupted, not a charge of zero.
          overdueCharges: late
            ? charges
                .filter((c) => c.buildingServiceFeeId !== '' && c.amount !== undefined)
                .map((c) => ({
                  buildingServiceFeeId: Number(c.buildingServiceFeeId),
                  amount: c.amount!,
                }))
            : [],
        },
      })
      setConfirmOpen(false)
      onClose()
    } catch (cause) {
      // Stays open: a refusal means the tenancy is untouched, and the reading is
      // the usual reason — it has to be corrected here, not rediscovered later.
      // The confirmation closes with it, so the correction is made on the form
      // rather than behind a dialog asking the same question again.
      setConfirmOpen(false)
      setError(errorMessage(cause))
    }
  }

  const isSubmitting = moveOutMutation.isPending
  const fees = (feesQuery.data ?? []).filter((fee) => fee.isActive)

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Kết thúc hợp đồng</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <DialogContentText>
            Ghi nhận khách đã dọn đi thật. Khác với huỷ hợp đồng — huỷ là ghi nhận hợp đồng chưa
            từng diễn ra.
          </DialogContentText>

          {error && <Alert severity="error">{error}</Alert>}

          <UnpaidInvoicesWarning
            leaseId={lease.id}
            action="Kết thúc hợp đồng không xoá khoản nợ này — sau khi khách dọn đi, chỗ còn lại để thu là tiền cọc."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Ngày khách dọn đi"
              type="date"
              fullWidth
              value={leftOn}
              onChange={(event) => setLeftOn(event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: lease.startDate.slice(0, 10) } }}
              helperText={`Hợp đồng thoả thuận đến hết ${formatCoveredThrough(lease.expectedEndDate)}`}
            />
            <TextField
              label="Số điện lúc trả phòng"
              type="number"
              fullWidth
              autoFocus
              value={reading}
              onChange={(event) => setReading(event.target.value)}
              slotProps={{
                htmlInput: { min: 0, step: 1 },
                input: { endAdornment: <InputAdornment position="end">kWh</InputAdornment> },
              }}
              /*
                The floor the API enforces, not the room's last known reading.

                Those are different figures on a tenancy that has been billed,
                and the screen used to show the second: it offered 1.411 while
                the September bill had already recorded 1.750, so an owner
                entering 1.500 — above what the hint said — was refused.
              */
              error={quaThap}
              helperText={
                quaThap
                  ? `Thấp hơn số đã xuất hoá đơn (${sanToiThieu?.toLocaleString('vi-VN')} kWh). Công tơ không quay ngược được.`
                  : sanToiThieu !== null
                  ? `Đã xuất hoá đơn tới ${sanToiThieu.toLocaleString('vi-VN')} kWh — không nhập thấp hơn`
                  : meterQuery.isFetching
                    ? 'Đang lấy số điện gần nhất…'
                    : meterQuery.data?.reading !== null && meterQuery.data?.reading !== undefined
                      ? `Số gần nhất của phòng: ${meterQuery.data.reading.toLocaleString('vi-VN')} kWh`
                      : 'Số trên công tơ lúc nhận lại phòng'
              }
            />
          </Stack>

          {late && (
            <Alert severity="warning" icon={false}>
              <AlertTitle sx={{ mb: 0.5 }}>Ở quá hạn hợp đồng</AlertTitle>
              Khách đi sau ngày hợp đồng hết hạn ({formatDate(lease.expectedEndDate)}). Những ngày
              vượt ra ngoài không có thoả thuận nào chi phối, nên tiền của chúng do bạn đặt. Để
              trống nếu bỏ qua, không tính gì thêm.
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {charges.map((charge, index) => (
                  <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <TextField
                      select
                      label="Khoản thu"
                      fullWidth
                      size="small"
                      value={charge.buildingServiceFeeId}
                      onChange={(event) =>
                        setCharges((cu) =>
                          cu.map((c, i) =>
                            i === index ? { ...c, buildingServiceFeeId: Number(event.target.value) } : c,
                          ),
                        )
                      }
                      helperText={feesQuery.isPending ? 'Đang tải danh mục…' : undefined}
                    >
                      {fees.map((fee) => (
                        <MenuItem key={fee.id} value={fee.id}>
                          {fee.name}
                        </MenuItem>
                      ))}
                    </TextField>
                    <MoneyInput
                      label="Số tiền"
                      value={charge.amount}
                      onChange={(value) =>
                        setCharges((cu) => cu.map((c, i) => (i === index ? { ...c, amount: value } : c)))
                      }
                      unit="đ"
                    />
                    <IconButton
                      aria-label={`Bỏ khoản ${index + 1}`}
                      onClick={() => setCharges((cu) => cu.filter((_, i) => i !== index))}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                <Box>
                  <Button
                    size="small"
                    disabled={fees.length === 0}
                    onClick={() =>
                      setCharges((cu) => [...cu, { buildingServiceFeeId: '', amount: undefined }])
                    }
                  >
                    Thêm khoản thu
                  </Button>
                  {fees.length === 0 && !feesQuery.isPending && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Toà nhà chưa có khoản thu nào để chọn.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Alert>
          )}

          {/* Said before the click, because each of these is irreversible here. */}
          <Typography variant="body2" color="text.secondary">
            Khi xác nhận: hoá đơn tháng cuối được phát hành (tính điện theo số vừa nhập), những
            người đang ở được ghi là đã rời đi, và phòng trở lại trạng thái trống.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting || !ready}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang kết thúc…' : 'Kết thúc hợp đồng'}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmOpen}
        title="Kết thúc hợp đồng này?"
        description={`Ghi nhận khách đã dọn đi ngày ${formatDate(leftOn)}, xuất hoá đơn tháng cuối theo số điện ${soDien ?? '—'}, và trả phòng ${lease.room?.roomCode ?? ''} về trạng thái trống. Không hoàn tác được.`}
        confirmLabel="Kết thúc hợp đồng"
        busyLabel="Đang kết thúc…"
        destructive
        busy={isSubmitting}
        onConfirm={() => void handleConfirm()}
        onClose={() => setConfirmOpen(false)}
      >
        <UnpaidInvoicesWarning
          leaseId={lease.id}
          action="Khoản này vẫn còn sau khi kết thúc hợp đồng."
        />
      </ConfirmDialog>
    </Dialog>
  )
}
