import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/lib/api-error'

/** Give up after this many attempts for failures that are worth retrying at all. */
const MAX_RETRIES = 2

/**
 * Retry only what repetition can actually fix.
 *
 * Every 4xx this backend produces is deterministic: a 400 from a zod schema, a
 * 403 from `requireRole`, a 404 from `parse-id`, a 409 from a partial unique
 * index. Retrying them asks the same question three times, gets the same answer,
 * and delays the error the user needs to see by several seconds.
 *
 * Transport failures and 5xx are the opposite — they may well succeed on a
 * second attempt, which is the case retrying exists for.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false
  if (isApiError(error) && error.isClientError) return false
  return true
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,

      // A few seconds, rather than react-query's default of 0. With 0, mounting
      // two components that read the same list refetches on every navigation.
      // Staleness is not a risk here because mutations invalidate explicitly.
      staleTime: 30_000,

      // Refetching on every window focus is noisy for an internal tool that one
      // person uses; explicit invalidation after mutations covers freshness.
      refetchOnWindowFocus: false,
    },
    mutations: {
      // A mutation that failed may have partially applied. Repeating it
      // automatically risks duplicating a payment or an invoice, so retrying
      // is always the caller's explicit decision.
      retry: false,
    },
  },
})
