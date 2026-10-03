import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { MoneyInput } from '@/components/MoneyField'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { conditionLabel } from '@/features/furniture/labels'
import { issueAdhocInvoice } from '@/features/invoices/api'
import type { LeaseFurniture } from '@/features/furniture/types'

interface Dong {
  id: number
  description: string
  amount: number | undefined
  include: boolean
}

/**
 * An OFFER to charge for what came back worse — never an automatic charge.
 *
 * ── Why the amount is prefilled but editable ──────────────────────────────
 *
 * The hand-over value is a starting point, not a verdict: a three-year-old
 * fridge is not worth what it cost. The owner edits it down, or drops the line
 * entirely.
 *
 * ── Why this is refusable, and why that is the common case ────────────────
 *
 * Wear the owner decides to absorb is ordinary. A charge raised without a
 * decision would be found later by the tenant rather than by the owner, which
 * is the wrong way round for a bill somebody has to explain.
 *
 * ── Why it is an invoice and not a deposit deduction ──────────────────────
 *
 * The deposit settles against invoices; there is deliberately no second,
 * weaker place to record money kept back. This change adds none.
 */
export function DamageInvoiceDialog({
  open,
  leaseId,
  items,
  onClose,
}: {
  open: boolean
  leaseId: number
  items: LeaseFurniture[]
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<Dong[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setRows(
      items.map((entry) => ({
        id: entry.id,
        description: `${entry.name}${entry.quantity > 1 ? ` × ${entry.quantity}` : ''} — giao lúc ${conditionLabel(
          entry.handoverCondition,
        )}, trả lúc ${conditionLabel(entry.returnCondition ?? 'damaged')}`,
        amount: entry.totalValue,
        include: true,
      })),
    )
    setError(null)
  }, [open, items])

  const chon = rows.filter((row) => row.include && row.description.trim() !== '')
  const tong = chon.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const ready = chon.length > 0 && chon.every((row) => row.amount !== undefined && row.amount >= 0)

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      await issueAdhocInvoice(
        leaseId,
        chon.map((row) => ({
          category: 'damage' as const,
          description: row.description.trim(),
          amount: row.amount!,
        })),
      )
      await queryClient.invalidateQueries({ queryKey: ['invoices'] })
      await queryClient.invalidateQueries({ queryKey: ['leases'] })
      onClose()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Lập hoá đơn hư hỏng?</DialogTitle>
      <DialogContent>
        <DialogContentText variant="body2" sx={{ mb: 2 }}>
          Hợp đồng đã kết thúc và tình trạng đồ đã được ghi lại. Có{' '}
          <strong>{items.length} món</strong> trả về tệ hơn lúc giao. Số tiền dưới đây lấy
          từ giá trị lúc bàn giao — <strong>chỉ là mức khởi điểm</strong>, sửa xuống được.
          Không muốn thu thì bấm “Không thu”.
        </DialogContentText>

        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack divider={<Divider />} spacing={1.5}>
            {rows.map((row, index) => (
              <Box key={row.id} sx={{ opacity: row.include ? 1 : 0.5 }}>
                <TextField
                  label="Nội dung"
                  fullWidth
                  size="small"
                  value={row.description}
                  disabled={!row.include || busy}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((r, i) =>
                        i === index ? { ...r, description: event.target.value } : r,
                      ),
                    )
                  }
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <MoneyInput
                      label="Số tiền"
                      value={row.amount}
                      onChange={(value) =>
                        setRows((current) =>
                          current.map((r, i) => (i === index ? { ...r, amount: value } : r)),
                        )
                      }
                      unit="đ"
                    />
                  </Box>
                  <Button
                    size="small"
                    color={row.include ? 'warning' : 'primary'}
                    disabled={busy}
                    onClick={() =>
                      setRows((current) =>
                        current.map((r, i) => (i === index ? { ...r, include: !r.include } : r)),
                      )
                    }
                    sx={{ mt: 1 }}
                  >
                    {row.include ? 'Bỏ dòng' : 'Thu lại'}
                  </Button>
                </Box>
              </Box>
            ))}
          </Stack>

          <Alert severity="info" icon={false}>
            Tổng thu: <strong>{formatMoney(tong)}</strong>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Tiền cọc <strong>không bị trừ thẳng</strong> — hoá đơn này phát hành rồi thì
              cọc đối trừ vào nó như mọi hoá đơn khác.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>
          Không thu
        </Button>
        <Button
          variant="contained"
          disabled={!ready || busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : undefined}
          onClick={() => void submit()}
        >
          {busy ? 'Đang lập…' : 'Lập hoá đơn'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
