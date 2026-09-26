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
  /**
   * Whether this account holds a password somebody else issued.
   *
   * Reported at sign-in so the application can go straight to changing it.
   * Without it the first thing a new employee would meet is a refusal, naming
   * a rule rather than the one thing they can do about it.
   */
  mustChangePassword: boolean;
}

export async function login(phone: string, password: string): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  /*
    A closed account is refused with the SAME answer as a wrong password.

    Saying "this account is deactivated" tells somebody trying passwords that
    the phone number is real and once had access — and tells a former employee
    exactly when they were cut off. Neither is anybody's business at a sign-in
    form.
  */
  if (!user.isActive) {
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

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    refreshTokenExpiresAt,
    mustChangePassword: user.mustChangePassword,
  };
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
  // Deactivating revokes the refresh tokens an account holds, but a race — a
  // renewal in flight as the owner closes the account — would otherwise mint a
  // fresh fifteen minutes of access.
  if (!record.user.isActive) {
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
  // What the application needs to know about the account beyond who it is:
  // whether it owes a password change, and which buildings it covers. Both
  // decide what the person is shown before they touch anything.
  mustChangePassword: true,
  staffBuildings: {
    select: { building: { select: { id: true, displayName: true } } },
    orderBy: { buildingId: "asc" as const },
  },
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

  const { staffBuildings, ...rest } = user;
  return { ...rest, buildings: staffBuildings.map((row) => row.building) };
}

/**
 * Changing one's own password — and nobody else's.
 *
 * The id comes from the verified token, so there is no id to pass and no way
 * to aim this at another account.
 *
 * Every OTHER session is revoked. A password is replaced because it may be
 * known to somebody else, and a session they already hold would survive the
 * replacement and make it pointless. The session doing the changing keeps
 * working: throwing the person out of the screen they just used to comply is a
 * punishment for complying.
 */
export async function changePassword(
  userId: number,
  input: { currentPassword?: string; newPassword: string },
  keepRefreshToken?: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    throw new UnauthorizedError("INVALID_CREDENTIALS", INVALID_CREDENTIALS_MESSAGE);
  }

  /*
    The current password is asked for — except on the first change.

    An account that still OWES a change holds a password somebody else chose
    and read to them; they typed it seconds ago to reach this endpoint at all.
    Asking for it again checks nothing the sign-in did not already check, and
    the one thing it reliably does is strand somebody who mistyped a password
    they never chose.

    Everywhere else it is required, and for a reason that does not apply above:
    a token left behind on a shared machine would otherwise be enough to take
    an account over permanently.

    Decided from the ACCOUNT, never from the request — a caller cannot opt out
    of the check by leaving the field off.
  */
  if (!user.mustChangePassword) {
    if (!input.currentPassword) {
      throw new UnauthorizedError("CURRENT_PASSWORD_REQUIRED", "The current password is required");
    }
    const matches = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedError("CURRENT_PASSWORD_INVALID", "That is not the current password");
    }
  }

  const keptHash = keepRefreshToken ? hashOpaqueToken(keepRefreshToken) : null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        passwordHash: await bcrypt.hash(input.newPassword, 10),
        mustChangePassword: false,
      },
    });
    await tx.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(keptHash ? { tokenHash: { not: keptHash } } : {}),
      },
      data: { revokedAt: new Date() },
    });
  });
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
