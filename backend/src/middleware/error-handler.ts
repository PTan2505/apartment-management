import type { NextFunction, Request, Response } from "express";
import {
  AppError,
  MalformedBodyError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
} from "@/lib/errors.js";

/**
 * Failures raised by the body parser, which happen before any route is reached.
 *
 * These are the caller's mistakes — unbalanced JSON, a body past the limit, an
 * encoding we do not read — but nothing throws an AppError for them, because
 * nothing of ours is running yet. Untranslated they fall to the catch-all below
 * and are answered as 500: the server confessing to a fault that was never its
 * own, and a caller told to retry something that will fail identically forever.
 *
 * `type` is body-parser's own discriminator and the only stable one; the
 * message wording is not. Anything unrecognised is deliberately left to fall
 * through rather than guessed at.
 */
function fromBodyParser(err: unknown): AppError | null {
  if (!(err instanceof Error) || !("type" in err) || typeof err.type !== "string") {
    return null;
  }

  switch (err.type) {
    case "entity.parse.failed":
      return new MalformedBodyError("Request body is not valid JSON");
    case "entity.too.large":
      return new PayloadTooLargeError("Request body is too large");
    case "encoding.unsupported":
      return new UnsupportedMediaTypeError("Request body uses an unsupported encoding");
    // The client stopped sending. It is very likely gone and will never read
    // this, but the alternative is recording a 500 against ourselves for it.
    case "request.aborted":
      return new MalformedBodyError("Request body was not fully received");
    default:
      return null;
  }
}

/**
 * Registered last, after all routes. Converts thrown errors into the
 * standard { status, code, message, details? } JSON shape. Domain services
 * should throw AppError subclasses (NotFoundError, ValidationError, etc.);
 * anything else is treated as an unexpected 500 with no leaked internals.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const appError = err instanceof AppError ? err : fromBodyParser(err);

  if (appError) {
    req.log?.warn({ err: appError }, appError.message);
    res.status(appError.status).json({
      status: appError.status,
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined ? { details: appError.details } : {}),
    });
    return;
  }

  req.log?.error({ err }, "Unhandled error");
  res.status(500).json({
    status: 500,
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}
