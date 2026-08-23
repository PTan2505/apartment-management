import { randomBytes, createHash } from "node:crypto";

/**
 * Long-lived credentials that are stored hashed and can be withdrawn.
 *
 * Two things in this system need one: a refresh token, and a tenant's portal
 * link. Both live for weeks or months and both have to be killable, which is
 * what rules out the access token's JWT — a signed claim consults nothing, so
 * nothing can stop it being accepted until it expires.
 *
 * 32 bytes: 256 bits of entropy. For the portal that is not a nicety but the
 * only defence there is — the endpoints are public, and nothing throttles them.
 * A token derived from an id, a timestamp, or a general-purpose UUID would make
 * the whole surface guessable and nothing downstream would notice.
 */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * SHA-256 rather than bcrypt, deliberately. bcrypt's cost exists to slow down a
 * dictionary attack on something a human chose; there is no dictionary for 256
 * bits of uniform randomness. And the stored value has to be found by equality
 * on every request, which a per-row comparison cannot do.
 */
export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
