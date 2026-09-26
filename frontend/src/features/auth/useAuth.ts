import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from '@/features/auth/AuthProvider'

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return value
}

/**
 * Whether the signed-in account is the owner.
 *
 * The one question every "may I change this?" on these screens reduces to. Of
 * the four roles, `owner` is the only one not narrowed, `customer` never signs
 * in here, and `maintenance` reaches none of the screens that ask.
 *
 * A boolean rather than a verb-keyed lookup — `canEditRoom`, `canRecordPayment`
 * — because eleven names for one answer is eleven things to keep in step with
 * the routers, and the second copy is the one that drifts. If a later role ever
 * needs finer answers, this function is where that grows; eleven inline
 * `role !== 'owner'` tests scattered through the screens would not be.
 *
 * NOT a security boundary. The API refuses these operations on its own; this
 * decides what the screen OFFERS, so that a manager meets a boundary they can
 * see rather than a red toast they cannot tell from a fault.
 */
export function useIsOwner(): boolean {
  return useAuth().user?.role === 'owner'
}
