import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { formatMoney } from '@/lib/format'
import { FURNITURE_CONDITIONS, conditionColor, conditionLabel } from '@/features/furniture/labels'
import type { CheckInEntry, FurnitureCondition, LeaseFurniture } from '@/features/furniture/types'

export type CheckInState = Record<number, FurnitureCondition | ''>

/** Only the items somebody actually gave a condition to. */
export function toCheckInEntries(state: CheckInState): CheckInEntry[] {
  return Object.entries(state)
    .filter(([, condition]) => condition !== '')
    .map(([id, condition]) => ({
      leaseFurnitureId: Number(id),
      returnCondition: condition as FurnitureCondition,
    }))
}

const RANK: Record<FurnitureCondition, number> = { new: 0, good: 1, worn: 2, damaged: 3 }

/** Items given a condition WORSE than the one they were handed over in. */
export function worseThanHandedOver(
  entries: LeaseFurniture[],
  state: CheckInState,
): LeaseFurniture[] {
  return entries.filter((entry) => {
    const picked = state[entry.id]
    return picked !== undefined && picked !== '' && RANK[picked] > RANK[entry.handoverCondition]
  })
}

/**
 * Checking the furniture back in, inside the move-out form.
 *
 * ── Why "unchecked" is the default and is said out loud ───────────────────
 *
 * Every selector starts empty, and an empty one records UNCHECKED. A form
 * where skipping means "fine" turns a tenancy nobody inspected into a tenancy
 * inspected and cleared — which is the record somebody gets shown later, and
 * the reason the column is nullable at all.
 *
 * Nothing here charges anybody. Damage is offered as an invoice afterwards,
 * which the owner may decline.
 */
export function FurnitureCheckInSection({
  entries,
  loading,
  state,
  onChange,
}: {
  entries: LeaseFurniture[]
  loading: boolean
  state: CheckInState
  onChange: (next: CheckInState) => void
}) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={22} />
      </Box>
    )
  }
  // A tenancy handed nothing over, or one that predates the record, shows no
  // section at all rather than an empty heading.
  if (entries.length === 0) return null

  const worse = worseThanHandedOver(entries, state)
  const chuaKiem = entries.filter((entry) => !state[entry.id]).length

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        Kiểm nội thất khi trả phòng
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        <strong>Không bắt buộc.</strong> Món nào bỏ trống sẽ được ghi là{' '}
        <strong>“chưa kiểm”</strong> — không phải “trả về nguyên vẹn”.
      </Typography>

      <Stack divider={<Divider />}>
        {entries.map((entry) => (
          <Box
            key={entry.id}
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
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {entry.name} {entry.quantity > 1 && `× ${entry.quantity}`}
              </Typography>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.25 }}>
                <Typography variant="caption" color="text.secondary">
                  Lúc giao:
                </Typography>
                <Chip
                  size="small"
                  color={conditionColor(entry.handoverCondition)}
                  label={conditionLabel(entry.handoverCondition)}
                />
                <Typography variant="caption" color="text.secondary">
                  · {formatMoney(entry.totalValue)}
                </Typography>
              </Stack>
            </Box>
            {/*
              `displayEmpty` so the unchosen state READS "Chưa kiểm" instead of
              being blank. Without it the control is empty, and an empty
              control is what somebody skims past as "nothing to do here" —
              while the thing it is about to record is precisely that nobody
              looked. The label is shrunk to match, since an empty value would
              otherwise let it sit over the text.
            */}
            <TextField
              select
              size="small"
              label="Lúc trả"
              value={state[entry.id] ?? ''}
              onChange={(event) =>
                onChange({ ...state, [entry.id]: event.target.value as FurnitureCondition | '' })
              }
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="">Chưa kiểm</MenuItem>
              {FURNITURE_CONDITIONS.map((value) => (
                <MenuItem key={value} value={value}>
                  {conditionLabel(value)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        ))}
      </Stack>

      {worse.length > 0 && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {worse.length} món tệ hơn lúc giao, tổng giá trị lúc bàn giao{' '}
          <strong>{formatMoney(worse.reduce((sum, entry) => sum + entry.totalValue, 0))}</strong>.
          Sau khi kết thúc hợp đồng, hệ thống sẽ <strong>hỏi</strong> có lập hoá đơn thu
          hay không — không tự thu, và không trừ thẳng vào cọc.
        </Alert>
      )}
      {chuaKiem > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {chuaKiem} món sẽ ghi là chưa kiểm.
        </Typography>
      )}
    </Box>
  )
}
