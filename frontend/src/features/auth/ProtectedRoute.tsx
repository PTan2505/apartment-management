import { Navigate, Outlet, useLocation } from 'react-router'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useAuth } from '@/features/auth/useAuth'
import type { SignInLocationState } from '@/features/auth/AuthProvider'

/**
 * Sits *above* AppShell, never inside it.
 *
 * Placed inside, the shell would mount and paint its navigation before the
 * redirect ran — a visible flash of an interface the visitor cannot use.
 */
export function ProtectedRoute() {
  const { status } = useAuth()
  const location = useLocation()

  // Neither the sign-in screen nor protected content until we know. Collapsing
  // this into "anonymous" is what makes a signed-in user see the sign-in screen
  // flash on every reload.
  if (status === 'pending') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  // The server is unreachable — which is not the same as being signed out.
  // Sending the user to sign in here would tell them something untrue and ask
  // for credentials that cannot be checked.
  if (status === 'offline') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', p: 2 }}>
        <Alert severity="warning" sx={{ mx: 'auto', maxWidth: 480 }}>
          <AlertTitle>Cannot reach the server</AlertTitle>
          Your session has not ended — the application simply cannot contact the
          API. Check that the backend is running, then reload.
        </Alert>
      </Box>
    )
  }

  if (status === 'anonymous') {
    // The attempted destination travels in router state rather than the URL, so
    // it is not carried into bookmarks or shared links for a page the visitor
    // could not open.
    const state: SignInLocationState = {
      from: location.pathname + location.search,
    }
    return <Navigate to="/login" replace state={state} />
  }

  return <Outlet />
}
