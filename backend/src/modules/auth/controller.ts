import type { Request, Response } from "express";
import { env } from "@/config/env.js";
import { ValidationError, UnauthorizedError } from "@/lib/errors.js";
import { changePasswordSchema, loginSchema } from "./schema.js";
import * as authService from "./service.js";

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/auth";

function refreshCookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    // Secure cookies are dropped by browsers over plain HTTP, which local dev uses.
    secure: env.NODE_ENV === "production",
    // `Strict` unless the application is on a different SITE from this API, in
    // which case a browser would not attach the cookie to a refresh at all.
    // Configured rather than inferred: behind a proxy this process does not
    // reliably know its own public origin, and a wrong guess produces a login
    // that works once and then silently stops being renewable.
    //
    // The env schema refuses `none` outside production, because the cookie is
    // only marked Secure there and browsers discard a SameSite=None cookie
    // that is not Secure.
    sameSite: (env.CROSS_SITE_COOKIES ? "none" : "strict") as "none" | "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  };
}

export async function loginHandler(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError("LOGIN_REQUEST_INVALID", "Invalid login request", parsed.error.flatten());
  }

  const { phone, password } = parsed.data;
  const result = await authService.login(phone, password);

  res.cookie(
    REFRESH_COOKIE_NAME,
    result.refreshToken,
    refreshCookieOptions(result.refreshTokenExpiresAt.getTime() - Date.now()),
  );
  res.status(200).json({
    accessToken: result.accessToken,
    // Said at sign-in so the application can go where the person has to go,
    // instead of letting them find out by being refused.
    mustChangePassword: result.mustChangePassword,
  });
}

export async function refreshHandler(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    throw new UnauthorizedError("REFRESH_TOKEN_MISSING", "Missing refresh token");
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
    throw new UnauthorizedError("NOT_AUTHENTICATED", "Not authenticated");
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

/**
 * Changing the caller's own password.
 *
 * Reachable while the account still owes a change — it is the one thing such
 * an account may do — so it hangs on the auth router, which `accountGuard`
 * does not sit on.
 */
export async function changePasswordHandler(req: Request, res: Response) {
  const userId = req.user?.userId;
  if (userId === undefined) {
    throw new UnauthorizedError("NOT_AUTHENTICATED", "Not authenticated");
  }

  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ValidationError(
      "PASSWORD_CHANGE_INVALID",
      "Invalid password change request",
      parsed.error.flatten(),
    );
  }

  // The session making the change keeps working; every other one is revoked.
  await authService.changePassword(userId, parsed.data, req.cookies?.[REFRESH_COOKIE_NAME]);
  res.status(204).send();
}
