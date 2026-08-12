import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";

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
  if (err instanceof AppError) {
    req.log?.warn({ err }, err.message);
    res.status(err.status).json({
      status: err.status,
      code: err.code,
      message: err.message,
      ...(err.details !== undefined ? { details: err.details } : {}),
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
