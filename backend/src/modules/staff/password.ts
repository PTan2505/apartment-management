import { randomInt } from "node:crypto";

/**
 * The alphabet a generated password is drawn from.
 *
 * Missing on purpose: O, 0, I, l, 1. This password is read aloud down a
 * telephone or copied out of a message, once, by somebody who did not choose
 * it — and a character nobody can name is a support call.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

/**
 * A first password: random enough to be a password, readable enough to be
 * dictated.
 *
 * Ten characters from an alphabet of 55 is about 58 bits — far beyond anything
 * a person would choose, and it is replaced at first sign-in anyway.
 *
 * `randomInt` rather than `Math.random`: this is a credential, and the
 * difference costs nothing.
 */
export function generateInitialPassword(): string {
  let out = "";
  for (let i = 0; i < 10; i += 1) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
