import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import { formatMoney } from '@/lib/format'

export interface AmountChange {
  label: string
  before: number | null | undefined
  after: number | null | undefined
}

/**
 * Compares numerically, not textually.
 *
 * `5000` and `5.000` are the same rate typed two ways, and a form hands back
 * whichever the owner left in the field. Comparing what they look like would
 * report a change that did not happen — and a confirmation that appears when
 * nothing changed is the fastest way to teach someone to dismiss it.
 */
export function changed(entries: AmountChange[]): AmountChange[] {
  return entries.filter((entry) => Number(entry.before ?? 0) !== Number(entry.after ?? 0))
}

/**
 * The figures a save is about to change, each as it was and as it will be.
 *
 * Only the ones that differ. A form is filled in over a minute or two, and a
 * rate changed at the start is off-screen by the time Save is reached — this is
 * the form showing its own diff, which it otherwise cannot do. Listing every
 * field instead would bury the one that matters.
 */
export function ChangedAmounts({ entries }: { entries: AmountChange[] }) {
  return (
    <Box
      component="dl"
      sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 2,
        rowGap: 0.5,
        m: 0,
        alignItems: 'baseline',
      }}
    >
      {entries.map((entry) => (
        <Box key={entry.label} sx={{ display: 'contents' }}>
          <Typography component="dt" variant="body2" color="text.secondary">
            {entry.label}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0 }}>
            <Box component="span" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
              {formatMoney(entry.before)}
            </Box>{' '}
            → <strong>{formatMoney(entry.after)}</strong>
          </Typography>
        </Box>
      ))}
    </Box>
  )
}
