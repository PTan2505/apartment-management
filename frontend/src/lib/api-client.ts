import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ApiError, type ApiErrorCode } from '@/lib/api-error'
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/features/auth/token-store'

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

    // Case 2a: the request never reached the application.
    //
    // A proxy sits between the browser and the backend, so "the backend is
    // down" does not arrive as a network error — the proxy answers instead,
    // with 502 and an empty body. Classifying that as a server rejection would
    // tell the user their session had ended whenever the backend was simply
    // not running, which is the exact confusion `kind` exists to prevent.
    //
    // A genuine backend fault is distinguishable: it carries the backend's own
    // JSON error body and is handled by case 1 above. Only a gateway status
    // *without* that body means nothing was reached.
    const GATEWAY_STATUSES = [502, 503, 504]
    if (GATEWAY_STATUSES.includes(response.status)) {
      return new ApiError({
        kind: 'transport',
        status: response.status,
        code: 'NETWORK_ERROR',
        message:
          'Could not reach the server. Check your connection and that the backend is running.',
      })
    }

    // Case 2b: a response we did not expect. Keep the status — it is still the
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

/* ─── Authentication ────────────────────────────────────────────────────────
 *
 * The access token is attached here, and an expired one is renewed here, so no
 * screen ever thinks about either.
 *
 * This lives in the client rather than in features/auth because it must run
 * *before* error normalization: once a failure has become an ApiError it no
 * longer carries the axios config, and the original request cannot be retried.
 * Axios runs response interceptors in registration order, so this one has to be
 * the same one.
 *
 * The refresh call is issued inline instead of importing features/auth/api,
 * which would import this module back.
 */

const REFRESH_PATH = '/auth/refresh'

/** Marks a request that has already been retried after a renewal. */
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retriedAfterRenewal?: boolean
}

/**
 * Called when a session ends because renewal failed — not when the user signs
 * out deliberately. The distinction is what lets the sign-in screen explain
 * itself in one case and stay quiet in the other.
 */
let onSessionExpired: (() => void) | null = null

export function setOnSessionExpired(handler: (() => void) | null): void {
  onSessionExpired = handler
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || !error.response || !error.config) {
      return Promise.reject(normalizeError(error))
    }

    const config = error.config as RetryableConfig
    const isRefreshCall = config.url?.endsWith(REFRESH_PATH) ?? false

    // Two guards, both load-bearing. Dropping either produces an unbounded
    // renewal cycle that presents as a hung page:
    //   - a retried request must not be retried again
    //   - the renewal call must not itself trigger a renewal
    const renewable =
      error.response.status === 401 && !config._retriedAfterRenewal && !isRefreshCall

    if (!renewable) {
      return Promise.reject(normalizeError(error))
    }

    try {
      // Bare axios, not apiClient: this must not pass back through the
      // interceptor chain. withCredentials carries the refresh cookie.
      const { data } = await axios.post<{ accessToken: string }>(
        `${apiClient.defaults.baseURL}${REFRESH_PATH}`,
        undefined,
        { withCredentials: true },
      )
      setAccessToken(data.accessToken)

      config._retriedAfterRenewal = true
      return await apiClient(config)
    } catch {
      // Renewal failed, so the session is genuinely over.
      clearAccessToken()
      onSessionExpired?.()
      return Promise.reject(normalizeError(error))
    }
  },
)
