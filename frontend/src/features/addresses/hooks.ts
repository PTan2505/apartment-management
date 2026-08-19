import { useQuery } from '@tanstack/react-query'

import { isApiError } from '@/lib/api-error'
import * as addressesApi from '@/features/addresses/api'

const ADDRESSES_KEY = ['addresses'] as const

/**
 * Candidates for a settled search term.
 *
 * The term is already debounced by the caller, so every value reaching here is
 * worth a request. Results are keyed by term, so retyping something recently
 * searched is served from cache rather than billed again.
 */
export function useAddressCandidates(term: string, sessionToken: string, enabled: boolean) {
  return useQuery({
    queryKey: [...ADDRESSES_KEY, 'search', term],
    queryFn: () => addressesApi.searchAddresses(term, sessionToken),
    enabled: enabled && term.trim().length > 0,
    // A search that fails does so deterministically — an unconfigured server
    // and an unavailable provider are both settled answers, not flakes.
    retry: false,
    staleTime: 5 * 60_000,
  })
}

/**
 * Whether address lookup can work on this deployment at all.
 *
 * The backend answers 503 for an unconfigured key *before* calling the
 * provider, so this probe costs nothing when lookup is off — which is the case
 * it exists to detect. When lookup is on it costs one search, cached for the
 * session, which buys opening the form already in the right state rather than
 * offering a search that turns out to be unanswerable.
 */
export function useAddressLookupAvailable() {
  const query = useQuery({
    queryKey: [...ADDRESSES_KEY, 'availability'],
    queryFn: () => addressesApi.searchAddresses('a', 'availability-probe'),
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const notConfigured =
    isApiError(query.error) && query.error.code === 'NOT_CONFIGURED'

  return {
    isPending: query.isPending,
    /** False only when the server says lookup is not set up at all. */
    available: !notConfigured,
    notConfigured,
  }
}
