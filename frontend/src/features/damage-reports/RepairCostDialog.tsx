import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
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
import { useRecordRepairCost, useRemoveRepairCost } from '@/features/damage-reports/hooks'
import type { DamageReport } from '@/features/damage-reports/types'

function dateOnly(iso: string | null) {
  return iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10)
}

/**
 * What the repair cost the owner.
 *
 * Opened from the report rather than from the expenses screen, because the
 * report is where the owner is when they learn the figure — the person who did
 * the work wrote it in the closing note. Asking them to re-state a building, a
 * room and a date on a blank expense form is how the cost stops being recorded.
 */
export function RepairCostDialog({
  open,
  report,
  onClose,
}: {
  open: boolean
  report: DamageReport | null
  onClose: () => void
}) {
  const record = useRecordRepairCost()
  const remove = useRemoveRepairCost()
  const [amount, setAmount] = useState<number | undefined>(undefined)
  const [on, setOn] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !report) return
    setAmount(report.cost?.amount)
    // Dates to the day the work was finished, not to today: the money belongs
    // to the month the repair happened in.
    setOn(report.cost ? dateOnly(report.cost.incurredAt) : dateOnly(report.closedAt))
    setError(null)
  }, [open, report])

  const daCo = report?.cost != null
  const busy = record.isPending || remove.isPending
  const ready = amount !== undefined && amount >= 0 && on !== ''

  async function run(fn: () => Promise<unknown>) {
    setError(null)
    try {
      await fn()
      onClose()
    } catch (cause) {
      // Stays open: the figure typed is worth keeping while the owner reads why.
      setError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{daCo ? 'Sửa chi phí sửa chữa' : 'Ghi chi phí sửa chữa'}</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Khoản này là <strong>chi phí của chủ nhà</strong>, không tính cho khách. Nó vào
          mục chi phí của toà và trừ vào doanh thu của tháng ghi bên dưới.
        </DialogContentText>
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          {report?.closingNote && (
            <Alert severity="info" icon={false}>
              Thợ ghi lại: “{report.closingNote}”
            </Alert>
          )}
          <MoneyInput
            label="Số tiền"
            value={amount}
            onChange={setAmount}
            unit="đ"
            autoFocus
            helperText="Nhập 0 nếu sửa xong mà không tốn gì."
          />
          <TextField
            label="Tính vào ngày"
            type="date"
            fullWidth
            value={on}
            onChange={(event) => setOn(event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Mặc định là ngày đóng báo hỏng. Ghi muộn thì doanh thu tháng đó đổi theo."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {daCo && (
          <Button
            color="warning"
            disabled={busy}
            onClick={() => run(() => remove.mutateAsync(report!.id))}
            sx={{ mr: 'auto' }}
          >
            Bỏ chi phí
          </Button>
        )}
        <Button onClick={onClose} disabled={busy}>
          Quay lại
        </Button>
        <Button
          variant="contained"
          disabled={!ready || busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() =>
            run(() =>
              record.mutateAsync({
                id: report!.id,
                input: { amount: amount!, incurredAt: on },
              }),
            )
          }
        >
          {busy ? 'Đang lưu…' : 'Lưu chi phí'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
