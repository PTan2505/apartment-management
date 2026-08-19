export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: string;
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = "NOT_FOUND";
}

export class ValidationError extends AppError {
  readonly status = 400;
  readonly code = "VALIDATION_ERROR";
}

export class UnauthorizedError extends AppError {
  readonly status = 401;
  readonly code = "UNAUTHORIZED";
}

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly code = "FORBIDDEN";
}

export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = "CONFLICT";
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
  readonly code = "NOT_CONFIGURED";
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
  readonly code = "UPSTREAM_UNAVAILABLE";
}
