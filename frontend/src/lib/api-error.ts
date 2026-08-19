/**
 * The single error representation every failed API request produces.
 *
 * Screens branch on this, never on a raw axios error or response body. The
 * backend's error handler emits `{ status, code, message, details? }` for every
 * failure it recognises, but a request can also fail without ever reaching the
 * backend, or reach something upstream that answers with HTML. All three arrive
 * here as the same shape.
 */

/** Error codes the backend's AppError subclasses emit. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_SERVER_ERROR'
  /** An optional feature is not set up on this deployment. */
  | 'NOT_CONFIGURED'
  /** A service the API depends on did not answer usefully. */
  | 'UPSTREAM_UNAVAILABLE'
  /** Assigned by the client when the request never got an answer. */
  | 'NETWORK_ERROR'
  /** Assigned by the client when a response did not match the backend shape. */
  | 'UNEXPECTED_RESPONSE'

/**
 * How the request failed.
 *
 * `server`   — the backend answered, and rejected the request.
 * `transport` — no answer arrived: offline, DNS failure, timeout, proxy down.
 *
 * These are kept apart rather than collapsed into a status of `0` because they
 * deserve opposite handling: a rejection is deterministic and repeating it is
 * pointless, while a transport failure is exactly the case worth retrying. A
 * status of `0` also slips past the `status >= 400` checks people write.
 */
export type ApiErrorKind = 'server' | 'transport'

/** The shape zod's `flatten()` produces, which the backend passes through as `details`. */
export interface FieldErrorDetails {
  formErrors?: string[]
  fieldErrors?: Record<string, string[] | undefined>
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  /** The HTTP status, or `null` when no response arrived. */
  readonly status: number | null
  readonly code: ApiErrorCode
  /** Whatever the backend sent as `details`, untouched. */
  readonly details: unknown

  constructor(init: {
    kind: ApiErrorKind
    status: number | null
    code: ApiErrorCode
    message: string
    details?: unknown
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status
    this.code = init.code
    this.details = init.details
  }

  /** The request was rejected by the server, so repeating it changes nothing. */
  get isClientError(): boolean {
    return this.status !== null && this.status >= 400 && this.status < 500
  }

  get isValidation(): boolean {
    return this.status === 400
  }

  /** Not signed in, or the access token expired. */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** Signed in, but not permitted. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  get isConflict(): boolean {
    return this.status === 409
  }

  get isTransport(): boolean {
    return this.kind === 'transport'
  }

  /**
   * Field-level messages from a validation failure, keyed by field name, so a
   * form can attach each message to the input it belongs to. Empty for any
   * failure that did not carry them.
   */
  get fieldErrors(): Record<string, string[]> {
    const details = this.details as FieldErrorDetails | undefined
    const raw = details?.fieldErrors
    if (!raw) return {}

    const result: Record<string, string[]> = {}
    for (const [field, messages] of Object.entries(raw)) {
      if (messages && messages.length > 0) result[field] = messages
    }
    return result
  }

  /** Validation messages that belong to the request as a whole, not to one field. */
  get formErrors(): string[] {
    return (this.details as FieldErrorDetails | undefined)?.formErrors ?? []
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
