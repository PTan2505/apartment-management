import { Navigate } from 'react-router'

import { startingPathFor } from '@/app/navigation'
import { useAuth } from '@/features/auth/useAuth'

/**
 * Where `/` goes, which depends on who is signed in.
 *
 * The owner starts at the buildings, a manager at the tenancies they run, and
 * maintenance at the reports — the only screen it is admitted to. One path for
 * everybody would make the first thing the application does, for one of the
 * three roles, be a refusal.
 */
export function RoleLanding() {
  const { user } = useAuth()
  if (!user) return null
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />
  return <Navigate to={startingPathFor(user.role)} replace />
}
