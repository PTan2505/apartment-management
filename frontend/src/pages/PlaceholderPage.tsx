import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

interface PlaceholderPageProps {
  title: string
  /** The OpenSpec change that replaces this page with the real screens. */
  providedBy: string
}

/**
 * Stands in for a domain's screens until its own change builds them.
 *
 * These exist so the shell's responsive navigation is demonstrable and testable
 * now, rather than being asserted here and first exercised three changes later.
 * Each names the change responsible for it so an unfinished area is never
 * mistaken for a broken one.
 */
export function PlaceholderPage({ title, providedBy }: PlaceholderPageProps) {
  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        {title}
      </Typography>
      <Alert severity="info">
        <AlertTitle>Not built yet</AlertTitle>
        These screens are provided by the <strong>{providedBy}</strong> change.
        This placeholder exists so the application shell and its navigation can
        be exercised before the domain screens land.
      </Alert>
    </Box>
  )
}
