/**
 * Where the access token lives.
 *
 * A module variable, mirrored to `localStorage`. It is deliberately not React
 * state: the axios request interceptor is not a component, so it cannot call a
 * hook, and it needs the token synchronously while building a request header.
 *
 * Nothing renders from this store. Whether the user is signed in is answered by
 * the `['auth','me']` query, not by the presence of a token — so there is no
 * subscription mechanism here and no second source of truth to drift.
 *
 * ── On `localStorage`, deliberately ─────────────────────────────────────────
 *
 * This is a recorded trade, not an oversight. A script injected into the page
 * can read a token stored here and use it elsewhere for up to its 15-minute
 * lifetime; keeping it in memory only would prevent that particular
 * exfiltration (though a script on the page could still call the API directly
 * for as long as the page is open).
 *
 * What it buys: the session survives a reload without waiting on a renewal
 * round-trip.
 *
 * The refresh token is unaffected by any of this: it stays in an httpOnly
 * cookie and is not reachable from JavaScript. The 30-day credential is never
 * exposed — only the 15-minute one.
 */

const STORAGE_KEY = 'apartment.accessToken'

/**
 * `localStorage` throws in a few real situations — Safari private browsing,
 * disabled site data, an over-quota origin. None of them should crash the app;
 * losing persistence degrades to an in-memory session, which still works.
 */
function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStored(token: string | null): void {
  try {
    if (token === null) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // Ignored on purpose — see above.
  }
}

// Seeded at module load so the very first request already carries the token,
// rather than going out bare and relying on a 401 to recover.
let accessToken: string | null = readStored()

/** Synchronous read, for the request interceptor. */
export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  if (accessToken === token) return
  accessToken = token
  writeStored(token)
}

export function clearAccessToken(): void {
  setAccessToken(null)
}

/*
 * Note: tabs are not kept in step with each other.
 *
 * Each tab holds its own copy of the token in memory. Signing out in one tab
 * removes the stored token, but another open tab keeps working until it
 * reloads — at which point it finds no token — or until its own token expires
 * and renewal fails against the revoked cookie, whichever comes first. That is
 * a window of at most the access token's lifetime.
 *
 * A `storage` event listener would close that window, and was deliberately
 * dropped in favour of a smaller auth surface.
 */
