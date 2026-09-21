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

import { MoneyInput } from '@/components/MoneyField'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { formatCoveredThrough, formatDate } from '@/features/leases/dates'
import { useExtendLease, useOccupants } from '@/features/leases/hooks'
import { useRoom } from '@/features/rooms/hooks'
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
  const [settleOnInvoice, setSettleOnInvoice] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setReading('')
    setMonths(String(lease.durationMonths))
    setRent(undefined)
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
  const ready =
    reading.trim() !== '' && Number.isFinite(soDien) && soDien >= 0 && soThang >= 1

  // What the successor's deposit will be, against what is already held. The
  // rent drives it, so raising the rent moves it — which is exactly the case
  // the owner needs told before they confirm.
  const depositMoi = (rent ?? 0) * lease.depositMonths
  const chenhLech = depositMoi - lease.depositHeld

  async function handleConfirm() {
    setError(null)
    try {
      const { lease: successor } = await extendMutation.mutateAsync({
        id: lease.id,
        input: {
          endMeterReading: soDien,
          durationMonths: soThang,
          ...(rent === undefined ? {} : { baseRent: rent }),
          ...(chenhLech === 0 ? {} : { settleDepositOnInvoice: settleOnInvoice }),
        },
      })
      onRenewed(successor.id)
    } catch (cause) {
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
              helperText="Số trên công tơ lúc gia hạn. Tháng cuối của hợp đồng cũ tính theo số này."
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
            helperText={
              roomQuery.isPending
                ? 'Đang lấy giá hiện tại của phòng…'
                : giaPhong !== undefined && giaPhong !== lease.baseRent
                  ? `Giá phòng hiện tại. Hợp đồng cũ đang là ${formatMoney(lease.baseRent)} / tháng.`
                  : 'Điền sẵn theo giá hiện tại của phòng. Gia hạn là lúc giá mới có hiệu lực.'
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
              Hợp đồng mới cần {formatMoney(depositMoi)} ({lease.depositMonths} tháng tiền thuê),
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
          onClick={() => void handleConfirm()}
          disabled={isSubmitting || !ready}
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {isSubmitting ? 'Đang gia hạn…' : 'Gia hạn hợp đồng'}
        </Button>
      </DialogActions>
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
