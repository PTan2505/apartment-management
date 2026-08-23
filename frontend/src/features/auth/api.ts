import { apiClient } from '@/lib/api-client'
import type { Account, TokenResponse } from '@/features/auth/types'
import type { LoginFormValues } from '@/features/auth/schema'

/**
 * The refresh token never appears here. It is an httpOnly cookie scoped to
 * /api/auth — the browser attaches it to these calls and JavaScript cannot read
 * it. `withCredentials` on the client is what lets it ride along.
 */

export const AUTH_REFRESH_PATH = '/auth/refresh'

export async function login(credentials: LoginFormValues): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials)
  return data
}

/**
 * Exchanges the refresh cookie for a new access token. The token itself is not
 * rotated — the same cookie stays valid — which is why several of these racing
 * each other is harmless.
 */
export async function refresh(): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>(AUTH_REFRESH_PATH)
  return data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

/**
 * The session check. Asking the server who we are detects an expired token, a
 * revoked one, and a tampered one identically — and returns the account the
 * app needs anyway, so it costs no extra round-trip.
 */
export async function fetchMe(): Promise<Account> {
  const { data } = await apiClient.get<Account>('/auth/me')
  return data
}
