import axios, { AxiosError } from 'axios'
import { ApiError, type ApiErrorCode } from '@/lib/api-error'

/**
 * The single HTTP instance every API request goes through.
 *
 * The base path is `/api`, which the dev server proxies to the backend (see
 * vite.config.ts). That makes requests same-origin from the browser's point of
 * view, so the refresh cookie is first-party and no cross-origin credential
 * negotiation is involved.
 *
 * `withCredentials` is on so cookies ride along. It is harmless while requests
 * are same-origin, and it is what `web-auth` depends on.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

/** The `{ status, code, message, details? }` body the backend's error handler emits. */
interface BackendErrorBody {
  status: number
  code: string
  message: string
  details?: unknown
}

function isBackendErrorBody(body: unknown): body is BackendErrorBody {
  if (typeof body !== 'object' || body === null) return false
  const candidate = body as Record<string, unknown>
  return (
    typeof candidate.code === 'string' && typeof candidate.message === 'string'
  )
}

/** Falls back to a code derived from the status when the body did not supply one. */
function codeForStatus(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'VALIDATION_ERROR'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT'
    default:
      return status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'UNEXPECTED_RESPONSE'
  }
}

/**
 * Turns anything axios rejects with into an ApiError.
 *
 * Three cases, deliberately given the same shape so no caller has to tell them
 * apart before it can read a message:
 *
 *   1. the backend answered with its standard error body   → use it verbatim
 *   2. the backend (or something upstream) answered with
 *      a body that is not that shape — an HTML error page,
 *      a proxy failure, an empty 502                       → keep the status,
 *                                                            synthesise a message
 *   3. nothing answered at all — offline, timeout, the
 *      backend is not running                              → transport failure
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>
    const response = axiosError.response

    // Case 3: the request never got an answer.
    if (!response) {
      const timedOut =
        axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT'
      return new ApiError({
        kind: 'transport',
        status: null,
        code: 'NETWORK_ERROR',
        message: timedOut
          ? 'The request timed out before the server responded.'
          : 'Could not reach the server. Check your connection and that the backend is running.',
      })
    }

    // Case 1: the backend's standard error body.
    if (isBackendErrorBody(response.data)) {
      return new ApiError({
        kind: 'server',
        status: response.status,
        code: response.data.code as ApiErrorCode,
        message: response.data.message,
        details: response.data.details,
      })
    }

    // Case 2: a response we did not expect. Keep the status — it is still the
    // most useful thing we know — and do not propagate a raw HTML body as a
    // user-facing message.
    return new ApiError({
      kind: 'server',
      status: response.status,
      code: codeForStatus(response.status),
      message: `The server returned an unexpected ${response.status} response.`,
      details: response.data,
    })
  }

  return new ApiError({
    kind: 'transport',
    status: null,
    code: 'NETWORK_ERROR',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
  })
}

// Every rejection leaves the client as an ApiError, so no screen ever sees an
// AxiosError.
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
)
