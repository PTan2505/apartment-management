import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Link } from 'react-router'

import { DEFAULT_PATH } from '@/app/navigation'

/**
 * Rendered inside the shell, not instead of it, so the navigation stays usable
 * — a mistyped address should not strand you on a page with no way out.
 */
export function NotFoundPage() {
  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Page not found
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        There is nothing at this address. Use the navigation, or go back to the
        start.
      </Typography>
      <Button variant="contained" component={Link} to={DEFAULT_PATH}>
        Go to Buildings
      </Button>
    </Box>
  )
}
