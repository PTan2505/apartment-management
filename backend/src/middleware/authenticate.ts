import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import { UnauthorizedError } from "@/lib/errors.js";
import type { AccessTokenPayload } from "@/modules/auth/service.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing or malformed Authorization header");
  }

  const token = header.slice("Bearer ".length);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    // `sub` is a string per the JWT spec; ids are integers in this system.
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) {
      throw new UnauthorizedError("Invalid access token subject");
    }
    req.user = { userId, role: payload.role };
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}
