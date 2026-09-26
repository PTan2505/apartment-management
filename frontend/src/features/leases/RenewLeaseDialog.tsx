import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useIsOwner } from '@/features/auth/useAuth'
import { MoneyInput } from '@/components/MoneyField'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { formatCoveredThrough, formatDate } from '@/features/leases/dates'
import { useExtendLease, useOccupants } from '@/features/leases/hooks'
import { useRoom } from '@/features/rooms/hooks'
import { UnpaidInvoicesWarning } from '@/features/leases/UnpaidInvoicesWarning'
import type { Lease } from '@/features/leases/types'

interface RenewLeaseDialogProps {
  open: boolean
  lease: Lease
  /** Where to send the owner once the successor exists. */
  onRenewed: (successorId: number) => void
  onClose: () => void
}

/** A fact of the operation, shown so it is not asked for again. */
function ThuaKe({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

/**
 * Renewing: the tenant is staying another term.
 *
 * ── Why this asks so little ─────────────────────────────────────────────────
 *
 * A renewal closes one tenancy and opens another in a single operation, and
 * almost everything the successor needs it already has: the start date is the
 * day the current agreement ends, the occupants continue, the service fees
 * carry at the building's CURRENT prices, and the deposit carries across.
 *
 * So this asks the two things that cannot be inferred — what the meter reads at
 * handover, and how long the new term is — and SHOWS the rest. A field that
 * restates what the system is about to copy is a chance for the two to
 * disagree.
 *
 * The rent is the exception, filled from the ROOM's current rent rather than
 * the tenancy's. A renewal is where a price rise takes effect; carrying the old
 * rent forward silently would make a rise unenforceable for as long as a tenant
 * keeps renewing.
 *
 * ── Why the invoices are named here ─────────────────────────────────────────
 *
 * Renewing issues two: the closing bill for the old tenancy's last month, and
 * the move-in bill for the new one. The owner will be answering a tenant's
 * questions about both, and meeting them afterwards is meeting them too late.
 */
export function RenewLeaseDialog({ open, lease, onRenewed, onClose }: RenewLeaseDialogProps) {
  const isOwner = useIsOwner()
  const extendMutation = useExtendLease()
  const occupantsQuery = useOccupants(lease.id)
  const [reading, setReading] = useState('')
  const [months, setMonths] = useState(String(lease.durationMonths))
  /*
    The ROOM's rent, not this tenancy's. A lease deliberately does not carry the
    room's current rent — it is governed by what it agreed — so the figure that
    makes a price rise visible has to be fetched.
  */
  const roomQuery = useRoom(lease.roomId, open)
  const giaPhong = roomQuery.data?.baseRent
  const [rent, setRent] = useState<number | undefined>(undefined)
  /*
    Số tháng cọc của hợp đồng nối tiếp. Điền sẵn bằng số của hợp đồng cũ, vì
    giữ nguyên là trường hợp thường gặp — nhưng gia hạn cũng chính là lúc thoả
    thuận lại được, nên owner sửa được. Manager thì không: cọc là con số chủ
    nhà đặt.
  */
  const [cocThang, setCocThang] = useState(String(lease.depositMonths))
  const [settleOnInvoice, setSettleOnInvoice] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReading('')
    setMonths(String(lease.durationMonths))
    setRent(undefined)
    setCocThang(String(lease.depositMonths))
    setSettleOnInvoice(true)
    setError(null)
  }, [open, lease])

  // Filled in as soon as the room answers, and only while the owner has not
  // typed: overwriting what they entered because a query settled late would be
  // the screen arguing with them.
  useEffect(() => {
    if (open && rent === undefined && giaPhong !== undefined) setRent(giaPhong)
  }, [open, rent, giaPhong])

  const current = (occupantsQuery.data?.data ?? []).filter((o) => o.leftAt === null)
  const soThang = Number(months)
  const soDien = Number(reading)
  // The same floor a move-out has to clear: a renewal closes this tenancy, and
  // its final month is billed from this reading.
  const sanToiThieu = lease.lastInvoicedMeterReading
  const quaThap =
    sanToiThieu !== null && reading.trim() !== '' && Number.isFinite(soDien) && soDien < sanToiThieu
  const ready =
    reading.trim() !== '' &&
    Number.isFinite(soDien) &&
    soDien >= 0 &&
    soThang >= 1 &&
    !quaThap &&
    Number.isInteger(Number(cocThang)) &&
    Number(cocThang) >= 0

  // What the successor's deposit will be, against what is already held. The
  // rent drives it, so raising the rent moves it — which is exactly the case
  // the owner needs told before they confirm.
  // Số tháng đang gõ, không phải số của hợp đồng cũ: owner hạ cọc từ 2 tháng
  // xuống 1 thì dòng chênh lệch bên dưới phải đổi theo, nếu không nó báo một
  // con số không còn đúng với cái sắp được tạo.
  const soCoc = Number(cocThang)
  const cocHopLe = Number.isInteger(soCoc) && soCoc >= 0
  const depositMoi = (rent ?? 0) * (cocHopLe ? soCoc : lease.depositMonths)
  const chenhLech = depositMoi - lease.depositHeld

  /*
    Asked between filling the form in and the two tenancies changing. A renewal
    closes this tenancy and opens another one in the same breath; nothing on
    this screen puts either back.
  */
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function handleConfirm() {
    setError(null)
    try {
      const { lease: successor } = await extendMutation.mutateAsync({
        id: lease.id,
        input: {
          endMeterReading: soDien,
          durationMonths: soThang,
          /*
            Only the owner names a rent. For a manager the field is read-only
            and already holds the room's current figure, so the API's own
            default produces the same tenancy — and SENDING it would be
            refused, because naming a price is what a manager may not do.
          */
          ...(isOwner && rent !== undefined ? { baseRent: rent } : {}),
          // Chỉ gửi khi owner đổi thật. Gửi lại đúng số cũ thì thừa, và với
          // manager thì bị từ chối — đặt giá là việc của chủ nhà.
          ...(isOwner && soCoc !== lease.depositMonths ? { depositMonths: soCoc } : {}),
          ...(chenhLech === 0 ? {} : { settleDepositOnInvoice: settleOnInvoice }),
        },
      })
      setConfirmOpen(false)
      onRenewed(successor.id)
    } catch (cause) {
      setConfirmOpen(false)
      // Stays open: a refusal here means neither tenancy changed, and closing
      // the dialog would leave the owner guessing which.
      setError(errorMessage(cause))
    }
  }

  const isSubmitting = extendMutation.isPending

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Gia hạn hợp đồng</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <UnpaidInvoicesWarning
            leaseId={lease.id}
            action="Khoản nợ này ở lại với hợp đồng cũ, không chuyển sang hợp đồng mới."
          />

          <Alert severity="info" icon={false}>
            <AlertTitle sx={{ mb: 0.5 }}>Khách ở tiếp</AlertTitle>
            Hợp đồng hiện tại kết thúc ngày {formatDate(lease.expectedEndDate)} và hợp đồng mới
            bắt đầu ngay hôm đó — không có ngày nào bỏ trống.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Số điện chốt"
              type="number"
              fullWidth
              autoFocus
              value={reading}
              onChange={(event) => setReading(event.target.value)}
              slotProps={{
                htmlInput: { min: 0, step: 1 },
                input: { endAdornment: <InputAdornment position="end">kWh</InputAdornment> },
              }}
              // Same floor as a move-out: the renewal closes this tenancy, and
              // its final month is billed from this figure.
              error={quaThap}
              helperText={
                quaThap
                  ? `Thấp hơn số đã xuất hoá đơn (${sanToiThieu?.toLocaleString('vi-VN')} kWh). Công tơ không quay ngược được.`
                  : sanToiThieu !== null
                    ? `Số trên công tơ lúc gia hạn — đã xuất hoá đơn tới ${sanToiThieu.toLocaleString('vi-VN')} kWh, không nhập thấp hơn.`
                    : 'Số trên công tơ lúc gia hạn. Tháng cuối của hợp đồng cũ tính theo số này.'
              }
            />
            <TextField
              label="Thời hạn mới"
              type="number"
              fullWidth
              value={months}
              onChange={(event) => setMonths(event.target.value)}
              slotProps={{
                htmlInput: { min: 1, step: 1 },
                input: { endAdornment: <InputAdornment position="end">tháng</InputAdornment> },
              }}
              helperText="Mặc định bằng thời hạn cũ."
            />
          </Stack>

          <MoneyInput
            label="Giá thuê hợp đồng mới"
            value={rent}
            onChange={setRent}
            unit="đ / tháng"
            readOnly={!isOwner}
            helperText={
              roomQuery.isPending
                ? 'Đang lấy giá hiện tại của phòng…'
                : !isOwner
                  ? 'Theo giá hiện tại của phòng. Chủ nhà là người đổi giá này.'
                  : giaPhong !== undefined && giaPhong !== lease.baseRent
                    ? `Giá phòng hiện tại. Hợp đồng cũ đang là ${formatMoney(lease.baseRent)} / tháng.`
                    : 'Điền sẵn theo giá hiện tại của phòng. Gia hạn là lúc giá mới có hiệu lực.'
            }
          />

          <TextField
            label="Tiền cọc hợp đồng mới"
            type="number"
            fullWidth
            value={cocThang}
            onChange={(event) => setCocThang(event.target.value)}
            slotProps={{
              htmlInput: { min: 0, step: 1 },
              input: {
                readOnly: !isOwner,
                endAdornment: <InputAdornment position="end">tháng</InputAdornment>,
              },
            }}
            error={cocThang.trim() !== '' && !cocHopLe}
            helperText={
              cocThang.trim() !== '' && !cocHopLe
                ? 'Nhập số tháng nguyên, không âm'
                : !isOwner
                  ? 'Theo hợp đồng cũ. Chủ nhà là người đổi số này.'
                  : 'Điền sẵn theo hợp đồng cũ. Gia hạn là lúc thoả thuận lại được.'
            }
          />

          {/*
            Only where it actually differs. A row explaining a difference of
            zero is a row that teaches the owner to skip this part of the dialog.
          */}
          {chenhLech !== 0 && (
            <Alert severity="warning" icon={false}>
              <AlertTitle sx={{ mb: 0.5 }}>
                Tiền cọc {chenhLech > 0 ? 'thiếu' : 'thừa'} {formatMoney(Math.abs(chenhLech))}
              </AlertTitle>
              Hợp đồng mới cần {formatMoney(depositMoi)} ({cocHopLe ? soCoc : lease.depositMonths}{' '}
              tháng tiền thuê),
              đang giữ {formatMoney(lease.depositHeld)}.
              <FormControlLabel
                sx={{ mt: 1, display: 'block' }}
                control={
                  <Switch
                    checked={settleOnInvoice}
                    onChange={(event) => setSettleOnInvoice(event.target.checked)}
                  />
                }
                label={
                  settleOnInvoice
                    ? 'Tính vào hoá đơn nhận phòng của hợp đồng mới'
                    : 'Tự thu/trả bằng tiền mặt, không đưa vào hoá đơn'
                }
              />
            </Alert>
          )}

          {/* Shown, not asked: everything here is carried by the operation. */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            <ThuaKe
              label="Hợp đồng mới ở từ"
              value={formatDate(lease.expectedEndDate)}
              hint={`Đến hết ${formatCoveredThrough(addMonths(lease.expectedEndDate, soThang))}`}
            />
            <ThuaKe
              label="Người ở giữ nguyên"
              value={
                occupantsQuery.isPending
                  ? 'Đang tải…'
                  : current.length === 0
                    ? 'Không có ai'
                    : current.map((o) => o.fullName).join(', ')
              }
              hint="Không phải nhập lại, kể cả người đứng tên"
            />
            <ThuaKe
              label="Tiền cọc"
              value={formatMoney(lease.depositHeld)}
              hint="Chuyển thẳng sang hợp đồng mới, không thu lại"
            />
            <ThuaKe
              label="Phí dịch vụ"
              value="Giữ nguyên các loại đang có"
              hint="Tính theo giá hiện tại của toà nhà"
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            Khi xác nhận sẽ phát sinh <strong>hai hoá đơn</strong>: hoá đơn tháng cuối của hợp
            đồng cũ (tính điện theo số vừa nhập, không tính tiền thuê) và hoá đơn nhận phòng của
            hợp đồng mới.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          onClick={() => setConfirmOpen(true)}
          disabled={isSubmitting || !ready}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang gia hạn…' : 'Gia hạn hợp đồng'}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmOpen}
        title="Gia hạn hợp đồng này?"
        /*
          Câu này từng hứa "giữ nguyên tiền cọc" — đúng khi cọc chưa sửa được,
          sai ngay khi owner đổi số tháng ngay phía trên. Một hộp xác nhận nói
          sai về việc nó sắp làm còn tệ hơn là không có hộp nào.
        */
        description={`Đóng hợp đồng hiện tại ngày ${formatDate(lease.expectedEndDate)} và mở hợp đồng mới ${soThang} tháng ngay hôm đó, giữ nguyên người ở. ${
          cocHopLe && soCoc !== lease.depositMonths
            ? `Tiền cọc đổi từ ${lease.depositMonths} tháng sang ${soCoc} tháng.`
            : 'Tiền cọc giữ nguyên.'
        } Không hoàn tác được bằng một thao tác.`}
        confirmLabel="Gia hạn hợp đồng"
        busyLabel="Đang gia hạn…"
        destructive
        busy={isSubmitting}
        onConfirm={() => void handleConfirm()}
        onClose={() => setConfirmOpen(false)}
      >
        <UnpaidInvoicesWarning
          leaseId={lease.id}
          action="Khoản này ở lại với hợp đồng cũ."
        />
      </ConfirmDialog>
    </Dialog>
  )
}

/**
 * The successor's last covered day, computed the same way the API computes an
 * expected end: months added to the start.
 *
 * Shown rather than promised — if this ever disagreed with the API it would be
 * a bug worth seeing, not a number worth hiding.
 */
function addMonths(iso: string, months: number): string {
  const date = new Date(iso)
  if (!Number.isFinite(months) || months < 1) return iso
  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}
