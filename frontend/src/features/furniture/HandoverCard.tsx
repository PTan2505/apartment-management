import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt'
import LockIcon from '@mui/icons-material/Lock'

import { errorMessage } from '@/lib/error-messages'
import { formatDate } from '@/features/leases/dates'
import { formatMoney } from '@/lib/format'
import { conditionColor, conditionLabel } from '@/features/furniture/labels'
import { useLeaseFurniture } from '@/features/furniture/hooks'
import type { Lease } from '@/features/leases/types'

/**
 * What this tenant was handed, on the day they signed.
 *
 * ── Presented as a RECORD, not a list ─────────────────────────────────────
 *
 * The room's furniture goes on changing; this does not. The two diverge, and a
 * reader who takes this for "what is in the room" will check the wrong one at
 * move-out. So the card says it is frozen, dates it, and offers no control
 * that would change it — there is no endpoint behind one anyway.
 *
 * ── Three empty states, not one ───────────────────────────────────────────
 *
 * Nobody recorded a hand-over · handed over unfurnished · handed over with
 * things. Only the middle one is a statement about this tenancy, and every
 * tenancy signed before this feature existed is the first.
 */
export function HandoverCard({ lease }: { lease: Lease }) {
  const query = useLeaseFurniture(lease.id)
  const record = query.data

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Nội thất đã bàn giao
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary">
              Bản ghi cố định của ngày nhận phòng — không đổi theo nội thất hiện tại của
              phòng, và không sửa được.
            </Typography>
          </Box>

          {query.isPending ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : query.error ? (
            <Alert severity="error">{errorMessage(query.error)}</Alert>
          ) : record === undefined ? null : !record.recorded ? (
            /*
              No record at all. Says so plainly rather than "handed over with
              nothing" — for an older tenancy the second would be a claim
              nobody ever made.
            */
            <Alert severity="info">
              Hợp đồng này <strong>chưa có bản bàn giao nội thất</strong> — được ký trước
              khi hệ thống ghi nhận khoản này. Lúc trả phòng sẽ không có gì để đối chiếu.
            </Alert>
          ) : record.data.length === 0 ? (
            <Alert severity="info">
              Bàn giao <strong>không kèm nội thất</strong>
              {record.recordedAt && ` · ghi ngày ${formatDate(record.recordedAt)}`}.
            </Alert>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary">
                Bàn giao ngày {formatDate(record.data[0]!.handedOverOn)}
              </Typography>
              <Stack divider={<Divider />}>
                {record.data.map((entry) => (
                  <Box key={entry.id} sx={{ py: 1 }}>
                    <Box
                      sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                          <Typography sx={{ fontWeight: 600 }}>{entry.name}</Typography>
                          <Chip size="small" variant="outlined" label={entry.kind} />
                          {entry.worse && (
                            <Chip size="small" color="error" label="Trả về tệ hơn" />
                          )}
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {entry.quantity} × {formatMoney(entry.unitValue)} ={' '}
                          <strong>{formatMoney(entry.totalValue)}</strong>
                          {entry.make && ` · ${entry.make}`}
                        </Typography>
                        {entry.handoverNote && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Lúc giao: {entry.handoverNote}
                          </Typography>
                        )}
                        {entry.returnNote && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            Lúc trả: {entry.returnNote}
                          </Typography>
                        )}
                      </Box>

                      {/*
                        Both ends side by side, because the comparison is the
                        only reason a condition was recorded at hand-over.
                      */}
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexShrink: 0 }}>
                        <Chip
                          size="small"
                          color={conditionColor(entry.handoverCondition)}
                          label={conditionLabel(entry.handoverCondition)}
                        />
                        <ArrowRightAltIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                        {entry.unchecked ? (
                          <Chip size="small" variant="outlined" label="Chưa kiểm" />
                        ) : (
                          <Chip
                            size="small"
                            color={conditionColor(entry.returnCondition!)}
                            label={conditionLabel(entry.returnCondition!)}
                          />
                        )}
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </Stack>

              {record.worse.length > 0 && (
                <Alert severity="warning">
                  {record.worse.length} món trả về tệ hơn lúc giao, tổng giá trị lúc bàn
                  giao{' '}
                  <strong>
                    {formatMoney(record.worse.reduce((sum, entry) => sum + entry.totalValue, 0))}
                  </strong>
                  . Muốn thu thì lập hoá đơn phát sinh — hệ thống không tự trừ cọc.
                </Alert>
              )}
              {record.uncheckedCount > 0 && lease.moveOutDate !== null && (
                <Typography variant="caption" color="text.secondary">
                  {record.uncheckedCount} món chưa được kiểm lúc trả phòng.
                </Typography>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  )
}
