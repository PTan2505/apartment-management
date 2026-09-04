/**
 * ── Why the code is an argument and the status is not ──────────────────────
 *
 * The status IS a property of the kind of error: everything not found is a 404,
 * and no caller of `NotFoundError` gets to disagree. The code is not. It names
 * WHICH failure happened, and only the throw site knows that.
 *
 * Before this, the class supplied both — so 95 unrelated rejections all
 * announced themselves as `VALIDATION_ERROR`, and nothing downstream could tell
 * "this room's building has been retired" from "this fee starts before its
 * lease". A code shared by unrelated failures is not a machine-readable code,
 * it is the status spelled out in letters.
 *
 * Codes are FROZEN once shipped. Another system stores them, branches on them
 * and translates them, so renaming one to read better breaks every caller. The
 * wording that should improve is the sentence each surface writes for its own
 * reader — which is exactly what having a stable code makes possible.
 */
export abstract class AppError extends Error {
  abstract readonly status: number;
  readonly code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;

    // Checked here rather than trusted, because a malformed code is invisible
    // until something downstream fails to match it — by which time it is in a
    // response somebody has already handled.
    if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
      throw new Error(
        `Error code must be SCREAMING_SNAKE_CASE, received: ${JSON.stringify(code)}`,
      );
    }
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;
}

export class ValidationError extends AppError {
  readonly status = 400;
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
}

export class ForbiddenError extends AppError {
  readonly status = 403;
}

export class ConflictError extends AppError {
  readonly status = 409;
}

/**
 * The request body could not be read as a document at all.
 *
 * Distinct from ValidationError, which reports fields that were read and found
 * wanting. Here nothing was read, so there are no fields to name — and a caller
 * that gets `VALIDATION_ERROR` with no `details` has to guess whether its JSON
 * is broken or a field is. The two need different fixes.
 */
export class MalformedBodyError extends AppError {
  readonly status = 400;
}

export class PayloadTooLargeError extends AppError {
  readonly status = 413;
}

export class UnsupportedMediaTypeError extends AppError {
  readonly status = 415;
}

/**
 * An optional feature is not set up on this deployment.
 *
 * Distinct from a fault: nothing is broken and the caller did nothing wrong —
 * the capability simply was not configured. 503 rather than 500 so it does not
 * read as an unexpected failure.
 */
export class NotConfiguredError extends AppError {
  readonly status = 503;
}

/**
 * A service this endpoint depends on did not answer usefully.
 *
 * Deliberately NOT reported as the caller being unauthenticated, even when the
 * upstream rejected *our* credentials: the caller is fine, our own credential is
 * not, and a 401 would send a signed-in user to a login screen for a fault they
 * cannot fix.
 */
export class UpstreamUnavailableError extends AppError {
  readonly status = 502;
}
