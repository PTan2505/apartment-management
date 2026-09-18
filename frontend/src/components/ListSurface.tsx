import type { ReactNode } from 'react'
import Paper from '@mui/material/Paper'

import { MOBILE_BREAKPOINT } from '@/app/theme'

/**
 * The surface a list screen stands on: one frame holding the filters AND the
 * results, because that is what they are — the filters describe the table
 * beneath them, and splitting them into two cards would claim they are two
 * unrelated things.
 *
 * Below the breakpoint it turns itself off. The lists are already a stack of
 * outlined cards down there, and a frame around a stack of frames reads as a
 * mistake rather than as structure.
 *
 * Lifted out of the invoices screen, which had it inline, so every list screen
 * is framed the same way instead of each page deciding for itself.
 */
export function ListSurface({ children }: { children: ReactNode }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        // `borderWidth`, not the `border` shorthand: MUI expands a responsive
        // shorthand into media queries that land after `borderColor` and reset
        // the colour to `currentColor`, which drew this frame in near-black
        // while every card in the app is outlined in the divider grey.
        borderWidth: { xs: 0, [MOBILE_BREAKPOINT]: 1 },
        borderStyle: 'solid',
        borderColor: 'divider',
        bgcolor: { xs: 'transparent', [MOBILE_BREAKPOINT]: 'background.paper' },
        p: { xs: 0, [MOBILE_BREAKPOINT]: 2 },
      }}
    >
      {children}
    </Paper>
  )
}
