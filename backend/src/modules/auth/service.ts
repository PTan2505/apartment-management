import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma.js";
import { env } from "@/config/env.js";
import { UnauthorizedError } from "@/lib/errors.js";

const INVALID_CREDENTIALS_MESSAGE = "Invalid phone number or password";

export interface AccessTokenPayload {
  /** User id. Kept as a string because JWT `sub` is a StringOrURI per RFC 7519. */
  sub: string;
  role: string;
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
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
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const accessToken = signAccessToken({ sub: String(user.id), role: user.role });

  const rawRefreshToken = randomBytes(32).toString("hex");
  const refreshTokenExpiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(rawRefreshToken),
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { accessToken, refreshToken: rawRefreshToken, refreshTokenExpiresAt };
}

export interface RefreshResult {
  accessToken: string;
}

export async function refresh(rawRefreshToken: string): Promise<RefreshResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const accessToken = signAccessToken({ sub: String(record.user.id), role: record.user.role });

  return { accessToken };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  const record = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!record || record.revokedAt) {
    return;
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });
}
