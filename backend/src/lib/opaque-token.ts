import { randomBytes, createHash, createCipheriv, createDecipheriv, hkdfSync } from "node:crypto";

import { env } from "@/config/env.js";

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

/* ------------------------------------------------------------------ */
/* Keeping a token readable — for one party, and no other              */
/* ------------------------------------------------------------------ */

/**
 * The key a portal token is encrypted under, derived from the application
 * secret rather than configured separately.
 *
 * HKDF, not the secret used raw: a key for one purpose should not be the same
 * bytes as a key for another, and `JWT_SECRET` is a string of unknown length
 * and unknown entropy distribution rather than 32 uniform bytes.
 *
 * No second environment variable, deliberately. It would be one more secret to
 * set on two deployments and lose, to protect something already lost if the
 * secret it would sit beside is.
 */
function encryptionKey(): Buffer {
  return Buffer.from(
    hkdfSync("sha256", env.JWT_SECRET, "portal-token-v1", "portal-token-encryption", 32),
  );
}

/**
 * A token kept so the owner can read it back, and a database alone cannot.
 *
 * AES-256-GCM, a fresh 12-byte nonce each time, stored as `iv.tag.ciphertext`
 * in hex. Authenticated encryption rather than a bare cipher: a tampered row
 * must fail to decrypt rather than yield some other string, since what comes
 * out is handed to the owner as a working link.
 */
export function encryptToken(token: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), body.toString("hex")].join(".");
}

/**
 * The stored token, or null when it cannot be read.
 *
 * Null rather than a thrown error: the one way this happens in practice is a
 * rotated `JWT_SECRET`, and the honest answer to the owner is "this link
 * exists, it still works, and it can no longer be shown" — not a failed
 * request, and certainly not a made-up token.
 */
export function decryptToken(stored: string): string | null {
  const [ivHex, tagHex, bodyHex] = stored.split(".");
  if (!ivHex || !tagHex || !bodyHex) return null;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(bodyHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
