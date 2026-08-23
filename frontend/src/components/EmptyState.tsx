import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface EmptyStateProps {
  title: string
  description?: string
  /** The action that fits this particular emptiness. */
  action?: ReactNode
}

/**
 * Shared because "nothing yet" and "nothing matches" are routinely conflated,
 * and the difference decides what the user should do next: create something, or
 * relax a filter. Telling someone with a filter applied that they have no
 * buildings is simply false.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && (
        <Typography color="text.secondary" sx={{ mb: action ? 3 : 0 }}>
          {description}
        </Typography>
      )}
      {action}
    </Box>
  )
}
