import type { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors.js";

/**
 * Gates a route by user role. Must be mounted AFTER `authenticate`, which
 * populates req.user — on its own this would reject every request.
 */
export function requireRole(...allowedRoles: string[]) {
  return function roleGuard(req: Request, _res: Response, next: NextFunction) {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError("Insufficient permissions for this resource");
    }

    next();
  };
}
