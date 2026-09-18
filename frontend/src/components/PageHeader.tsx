import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface PageHeaderProps {
  title: string
  /** The one thing this screen exists to add. Right of the title, on every screen. */
  action?: ReactNode
  /** `h2` on a page of its own; `h3` for a section inside a page. */
  level?: 'h2' | 'h3'
}

/**
 * The title row every list screen opens with.
 *
 * Its job is the action's POSITION. Before this, the button to add something
 * sat in three different places depending on the screen — beside the title on
 * buildings and expenses, above the table inside the frame on rooms and
 * tenancies, and tucked at the end of the filter row on customers — so the
 * first thing an owner does on a screen was somewhere new each time.
 *
 * It wraps rather than shrinks at phone width: the button keeps its label, and
 * drops under the title when there is no room beside it.
 */
export function PageHeader({ title, action, level = 'h2' }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        mb: 2,
      }}
    >
      <Typography variant={level === 'h2' ? 'h5' : 'h6'} component={level}>
        {title}
      </Typography>
      {action}
    </Box>
  )
}
