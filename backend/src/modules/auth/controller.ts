import type { Request, Response } from "express";
import { env } from "@/config/env.js";
import { ValidationError, UnauthorizedError } from "@/lib/errors.js";
import { loginSchema } from "./schema.js";
import * as authService from "./service.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/auth";

function refreshCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    // Secure cookies are dropped by browsers over plain HTTP, which local dev uses.
    secure: env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  };
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("Invalid login request", parsed.error.flatten());
  }

  const { phone, password } = parsed.data;
  const result = await authService.login(phone, password);

  res.cookie(
    REFRESH_COOKIE_NAME,
    result.refreshToken,
    refreshCookieOptions(result.refreshTokenExpiresAt.getTime() - Date.now()),
  );
  res.status(200).json({ accessToken: result.accessToken });
}

export async function refreshHandler(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw new UnauthorizedError("Missing refresh token");
  }

  const result = await authService.refresh(refreshToken);
  res.status(200).json({ accessToken: result.accessToken });
}

export async function meHandler(req: Request, res: Response) {
  // Identity comes from the verified token and nowhere else. Reading an id from
  // req.params, req.query, or req.body here would let any caller read another
  // user's account.
  const userId = req.user?.userId;
  if (userId === undefined) {
    throw new UnauthorizedError("Not authenticated");
  }

  const user = await authService.getCurrentUser(userId);
  res.status(200).json(user);
}

export async function logoutHandler(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (refreshToken) {
    await authService.logout(refreshToken);
  }

  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  res.status(200).json({ success: true });
}
