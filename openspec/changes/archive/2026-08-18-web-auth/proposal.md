## Why

`web-foundation` built the shell, the router, and the API client, but nothing signs in. Every domain endpoint rejects an unauthenticated request, so the seven placeholder screens cannot be replaced by real ones until a session exists — this change is what unblocks all of them.

It is also the first time the refresh cookie is exercised by a browser holding a real session. Until now the proxy's cookie-path rewrite has only been proven with `curl` and a cookie jar.

## What Changes

- Add a login page, outside the application shell, taking a phone number and password.
- Persist the access token in `localStorage` and attach it to every API request.
- Restore the session automatically on page load, and renew it transparently when the access token expires, without the user re-entering credentials.
- Gate every destination behind authentication. An unauthenticated visitor is sent to the login page and returned to the address they originally asked for once signed in.
- Show who is signed in — name and phone — in an account menu in the app bar, with a logout action.
- Log out cleanly: revoking the session server-side, clearing the stored token, and discarding all cached data so none of it is visible to whoever signs in next.
- Explain a session that ends on its own, rather than dropping the user on a login page with no reason given.

### The decisions this rests on

**`GET /auth/me` is the session check.** Rather than inspecting the stored token's expiry, the application asks the server who it is. A token that is expired, revoked, or tampered with all take the same failure path, and a successful answer supplies the user record the account menu needs. This is why `api-auth-me` was built first, and it means no JWT is ever decoded client-side.

**Renewal is reactive.** The application waits for a request to be rejected, renews, and retries it once. Renewing on a timer would need to stay correct across sleep, suspend, and clock changes, for the sake of avoiding one rejected request every fifteen minutes.

**The access token lives in `localStorage`.** This is a deliberate trade, recorded here so it is not mistaken for an oversight: a script injected into the page can read a token stored this way and use it elsewhere, which in-memory storage would prevent. In exchange, the session survives a reload without waiting on a renewal round-trip. The refresh token remains in an `httpOnly` cookie and is never reachable from JavaScript.

**"Cannot reach the server" is not "signed out".** A failure with no response is reported as a connection problem. Redirecting to the login page when the backend is simply down would tell the user something untrue.

## Capabilities

### New Capabilities
- `web-auth`: signing in and out of the browser application — how a session is established, persisted across reloads, renewed when it expires, and ended.

### Modified Capabilities
- `web-infrastructure`: "Destinations are addressable and restorable" — destinations now require an authenticated session, and an address opened without one is remembered and returned to after signing in. Without this the two specs would contradict each other on whether entering an address opens its destination.

## Impact

- **Code**: new `frontend/src/features/auth/`; modifications to `app/router.tsx` (login outside the shell, the gate above it), `lib/api-client.ts` (attaching the token, renewing on rejection), and `layouts/AppShell.tsx` (the account menu).
- **Dependencies added**: `react-hook-form` and `@hookform/resolvers`, for the login form and the domain forms that follow. `zod` is already present.
- **Backend**: none. `api-auth-me` supplied the only endpoint this needed.
- **Behavioral change**: the seven placeholder destinations become unreachable without signing in. Nothing else consumes the frontend.
- **Dependencies on other work**: requires `web-foundation` and `api-auth-me`, both merged. Blocks every domain screen change.
- **Out of scope**: keeping open tabs in step with each other — a tab that is already open keeps working until it reloads or its short-lived credential expires. Also no password change, no password reset, no account editing, no "remember me" (the refresh cookie's lifetime is fixed server-side), no tenant login — `customer` accounts still have no password — and no role-based routing, since `owner` is the only role that can sign in.
