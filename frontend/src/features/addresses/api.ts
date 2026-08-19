import { apiClient } from '@/lib/api-client'
import type { AddressCandidate, ResolvedAddress } from '@/features/addresses/types'

/**
 * A run of searches and the resolution that follows are grouped by a session
 * token, because the provider bills by session rather than by request. Without
 * it, typing an address is billed per keystroke.
 */
export async function searchAddresses(
  input: string,
  sessionToken: string,
): Promise<AddressCandidate[]> {
  const { data } = await apiClient.get<{ candidates: AddressCandidate[] }>(
    '/addresses/search',
    { params: { input, sessionToken } },
  )
  return data.candidates
}

export async function resolveAddress(
  placeId: string,
  sessionToken: string,
): Promise<ResolvedAddress> {
  const { data } = await apiClient.get<ResolvedAddress>(
    `/addresses/${encodeURIComponent(placeId)}`,
    { params: { sessionToken } },
  )
  return data
}
