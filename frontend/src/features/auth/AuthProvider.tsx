import { createContext, useCallback, useEffect, useMemo, useRef } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError, isApiError } from '@/lib/api-error'
import { setOnSessionExpired } from '@/lib/api-client'
import * as authApi from '@/features/auth/api'
import { clearAccessToken, setAccessToken } from '@/features/auth/token-store'
import type { Account } from '@/features/auth/types'
import type { LoginFormValues } from '@/features/auth/schema'

export const AUTH_QUERY_KEY = ['auth', 'me'] as const

/**
 * Four states, not two.
 *
 *   pending       still finding out — show neither sign-in nor content
 *   authenticated signed in, account in hand
 *   anonymous     genuinely signed out
 *   offline       the server could not be reached — NOT signed out
 *
 * The fourth is the one usually missing. Treating a transport failure as
 * "signed out" tells every user their session ended whenever the backend is
 * down, and sends them to re-enter credentials that cannot be checked.
 */
export type AuthStatus = 'pending' | 'authenticated' | 'anonymous' | 'offline'

export interface AuthContextValue {
  status: AuthStatus
  user: Account | null
  /** Present when status is 'offline', for the message to show. */
  error: ApiError | null
  signIn: (values: LoginFormValues) => Promise<void>
  signOut: () => Promise<void>
  isSigningIn: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Router state carried to the sign-in screen when a session ends by itself. */
export interface SignInLocationState {
  from?: string
  reason?: 'expired'
}

/**
 * Auth state is a React Query query rather than a hand-written state machine.
 *
 * `GET /auth/me` is the session check: asking the server detects an expired
 * token, a revoked one, and a tampered one identically, and returns the account
 * the app needs anyway. Nothing here decodes a JWT.
 *
 * This is mounted as a layout route rather than around RouterProvider, because
 * a data router takes no children and this needs `useNavigate`.
 */
export function AuthProvider() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.fetchMe,
    // Pinned locally rather than left to the shared default. The default
    // already refuses to retry a 4xx, but boot is the one place an accidental
    // retry would visibly stall the splash, so it is stated where it is read.
    retry: false,
    staleTime: Infinity,
  })

  /**
   * Whether a session ever actually existed in this tab.
   *
   * Renewal failing is not the same as a session ending, and conflating the two
   * produced two separate wrong behaviours:
   *
   *   - A visitor who has never signed in also fails renewal — the boot check
   *     401s and there is no cookie to renew from. That was reported as "your
   *     session ended", and captured `/login` as the destination to return to,
   *     because the gate's redirect had already moved the URL by then.
   *
   *   - After a deliberate sign-out, clearing the cache refetches this query,
   *     which 401s and attempts a renewal against the cookie that was just
   *     revoked. That failure was also read as an expiry, so signing out
   *     announced that the session had ended unexpectedly.
   */
  const hadSessionRef = useRef(false)
  useEffect(() => {
    if (query.data) hadSessionRef.current = true
  }, [query.data])

  const signOutLocally = useCallback(
    (state?: SignInLocationState) => {
      // Reset before clearing, for the second case described above.
      hadSessionRef.current = false
      clearAccessToken()
      // Discards every cached query, so no data from the previous session is
      // visible to whoever signs in next.
      queryClient.clear()
      navigate('/login', { replace: true, state })
    },
    [navigate, queryClient],
  )

  // Renewal failed on a session that existed, so it has ended on its own.
  // Deliberate sign-out does not come through here — that distinction is what
  // lets the sign-in screen explain itself in one case and stay quiet in the
  // other.
  useEffect(() => {
    setOnSessionExpired(() => {
      // Never signed in: ProtectedRoute handles the redirect, and it records
      // the attempted destination correctly because it runs before the URL
      // moves.
      if (!hadSessionRef.current) return
      hadSessionRef.current = false
      signOutLocally({
        from: window.location.pathname + window.location.search,
        reason: 'expired',
      })
    })
    return () => setOnSessionExpired(null)
  }, [signOutLocally])

  const signInMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const { accessToken } = await authApi.login(values)
      setAccessToken(accessToken)
      // Login returns only a token — no account — so the account still has to
      // be fetched. Writing it into the query cache directly means
      // ProtectedRoute sees 'authenticated' immediately rather than flickering
      // back through 'pending'.
      const account = await authApi.fetchMe()
      queryClient.setQueryData(AUTH_QUERY_KEY, account)
      return account
    },
  })

  const signIn = useCallback(
    async (values: LoginFormValues) => {
      await signInMutation.mutateAsync(values)
    },
    [signInMutation],
  )

  const signOut = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // The local session ends regardless. A user who has asked to leave must
      // never be trapped in a session because the server is unreachable.
    }
    signOutLocally()
  }, [signOutLocally])

  const status: AuthStatus = useMemo(() => {
    if (query.isPending) return 'pending'
    if (query.data) return 'authenticated'
    if (isApiError(query.error) && query.error.isTransport) return 'offline'
    return 'anonymous'
  }, [query.isPending, query.data, query.error])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user: query.data ?? null,
      error: isApiError(query.error) ? query.error : null,
      signIn,
      signOut,
      isSigningIn: signInMutation.isPending,
    }),
    [status, query.data, query.error, signIn, signOut, signInMutation.isPending],
  )

  return (
    <AuthContext.Provider value={value}>
      <Outlet />
    </AuthContext.Provider>
  )
}
