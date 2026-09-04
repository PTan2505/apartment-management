import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma.js";
import { env } from "@/config/env.js";
import { UnauthorizedError } from "@/lib/errors.js";
import { generateOpaqueToken, hashOpaqueToken } from "@/lib/opaque-token.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid phone number or password";

export interface AccessTokenPayload {
  /** User id. Kept as a string because JWT `sub` is a StringOrURI per RFC 7519. */
  sub: string;
  role: string;
}

function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"] });
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export async function login(phone: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  const accessToken = signAccessToken({ sub: String(user.id), role: user.role });

  const rawRefreshToken = generateOpaqueToken();
  const refreshTokenExpiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashOpaqueToken(rawRefreshToken),
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
}

export interface RefreshResult {
  accessToken: string;
}

export async function refresh(rawRefreshToken: string): Promise<RefreshResult> {
  const tokenHash = hashOpaqueToken(rawRefreshToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new UnauthorizedError("REFRESH_TOKEN_INVALID", "Invalid or expired refresh token");
  }

  const accessToken = signAccessToken({ sub: String(record.user.id), role: record.user.role });

  return { accessToken };
}

// Explicit selection so password material can never leak into a response by
// being added to the model later. Mirrors `customerSelect` in the customers
// module.
const meSelect = {
  id: true,
  phone: true,
  fullName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function getCurrentUser(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: meSelect,
  });

  // The token verified, but its subject no longer exists — the account was
  // removed after the token was issued. That is an authentication failure, not
  // a missing resource: the caller is nobody, so 401 rather than 404 or a 500
  // from returning null.
  if (!user) {
    throw new UnauthorizedError("ACCOUNT_GONE", "Account no longer exists");
  }

  return user;
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashOpaqueToken(rawRefreshToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record || record.revokedAt) {
    return;
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
}
