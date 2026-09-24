import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { ConfirmDialog } from '@/components/ConfirmDialog'
import { errorMessage } from '@/lib/error-messages'
import { formatMoney } from '@/lib/format'
import { formatDate } from '@/features/leases/dates'
import { useDepositSettlement, useRefundDeposit } from '@/features/leases/hooks'
import type { Lease } from '@/features/leases/types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** One figure of the three the decision is made from. */
function ConSo({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{formatMoney(value)}</Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  )
}

/**
 * What the deposit settles to, once a tenancy has closed.
 *
 * ── Why three figures and no total ──────────────────────────────────────────
 *
 * The holding, what has been deducted from it, and what the tenancy still owes
 * on unpaid bills. The screen does NOT subtract the third from the first and
 * offer a number to hand back.
 *
 * It could, and it would be wrong to. What a deposit covers is a negotiation —
 * damage, an unpaid month, a cleaning bill — and a figure presented as "what to
 * return" is a decision made on the owner's behalf that will be believed. The
 * cancellation dialog refuses to guess how a holding splits for the same reason.
 *
 * Shown only after a move-out, because until then there is nothing to settle.
 */
export function DepositSettlementCard({ lease }: { lease: Lease }) {
  const settlementQuery = useDepositSettlement(lease.id, lease.moveOutDate !== null)
  const refundMutation = useRefundDeposit()
  const [asking, setAsking] = useState(false)
  const [refundedAt, setRefundedAt] = useState(today())
  const [error, setError] = useState<string | null>(null)

  if (lease.moveOutDate === null) return null

  const settlement = settlementQuery.data
  const daTra = settlement?.depositRefundedAt != null

  async function handleRefund() {
    setError(null)
    try {
      await refundMutation.mutateAsync({ id: lease.id, refundedAt })
      await settlementQuery.refetch()
      setAsking(false)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Tiền cọc sau khi kết thúc</Typography>

          {settlementQuery.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : settlement === undefined ? (
            <Alert severity="warning">Chưa lấy được số liệu tiền cọc.</Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                }}
              >
                <ConSo label="Đang giữ" value={settlement.depositHeld} hint="Số tiền cọc còn nắm" />
                <ConSo
                  label="Đã trừ vào cọc"
                  value={settlement.deductedFromDeposit}
                  hint="Các khoản đã khấu trừ trước đó"
                />
                <ConSo
                  label="Hoá đơn chưa thu"
                  value={settlement.outstandingInvoices}
                  hint="Chưa tự trừ — bạn quyết trừ hay không"
                />
              </Box>

              {daTra ? (
                <Alert severity="success">
                  Đã trả cọc cho khách ngày {formatDate(settlement.depositRefundedAt!)}
                  {settlement.depositRefunded !== null
                    ? ` · ${formatMoney(settlement.depositRefunded)}`
                    : ''}
                  .
                </Alert>
              ) : (
                <Box>
                  <Button variant="outlined" onClick={() => setAsking(true)}>
                    Ghi nhận đã trả cọc
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Ghi lại ngày trả {formatMoney(settlement.depositHeld)} cho khách. Muốn trừ bớt
                    thì xử lý khoản trừ trước, rồi mới ghi nhận trả phần còn lại.
                  </Typography>
                </Box>
              )}

              {error && !asking && <Alert severity="error">{error}</Alert>}
            </>
          )}
        </Stack>
      </CardContent>

      <ConfirmDialog
        open={asking}
        title="Ghi nhận đã trả cọc?"
        description={
          settlement
            ? `${formatMoney(settlement.depositHeld)} được ghi là đã trả cho khách. Không ghi lại lần thứ hai được.`
            : undefined
        }
        confirmLabel="Ghi nhận đã trả"
        busyLabel="Đang ghi…"
        busy={refundMutation.isPending}
        error={error}
        onConfirm={() => void handleRefund()}
        onClose={() => setAsking(false)}
      >
        <TextField
          label="Ngày trả"
          type="date"
          fullWidth
          value={refundedAt}
          onChange={(event) => setRefundedAt(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          helperText="Mặc định là hôm nay."
        />
      </ConfirmDialog>
    </Card>
  )
}
