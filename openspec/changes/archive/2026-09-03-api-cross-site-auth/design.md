## Context

See proposal.md — Why. What exists today:

- `app.use(cors())` — wildcard origin, no credentials.
- The refresh cookie: `httpOnly`, `secure` in production only, `sameSite: "strict"`, `path: /auth`, opaque, DB-backed, revocable per device, non-rotating.
- The access token travels in an `Authorization` header, not a cookie.
- The tenant portal carries its token in a header too, and has never used a cookie.
- Env is validated fail-fast by a zod schema; anything new must be added there and mirrored in `.env.example`.

## Goals / Non-Goals

**Goals:**

- Make a cross-site deployment possible without weakening a same-site one.
- Stop granting every origin on the internet browser access for no reason.
- Fail loudly on a combination browsers ignore silently.

**Non-Goals:**

- Deploying.
- Rotating refresh tokens or adding CSRF tokens — see the risk below.
- Any change to how a session is validated.

## Decisions

**`SameSite` is configuration, not inference.**

The API could try to work it out — compare the configured web origin against its own — but it does not reliably know its own public origin behind a proxy, and a wrong guess produces a login that works once and then silently stops. Stating it is one line in an environment file and cannot be wrong by accident.

Default stays `Strict`: it is the safer value and the right one when everything is served from one host.

**`SameSite=None` without `Secure` is refused at startup, not tolerated.**

Browsers discard such a cookie. Tolerating the combination would mean the API believes it issued a session while the browser kept nothing — surfacing as a login that appears to succeed and cannot be renewed, with no error anywhere. The env schema already fails fast on bad configuration; this belongs with it.

**An empty origin list means permissive, rather than requiring configuration.**

Local development would otherwise need an env var before the API would talk to a browser at all — a cost paid every day for a protection that only matters once deployed. The permissive branch is what runs today, so nothing local changes.

The trade is that a production deployment which forgets to set it keeps today's wildcard rather than locking itself out. That is the right way round: an over-permissive API is recoverable, a deployment that refuses its own frontend is an outage.

## Risks / Trade-offs

**`SameSite=None` allows a hostile page to trigger a refresh** → It can cause the request; it cannot read the response, because the origin allowlist means no `Access-Control-Allow-Origin` comes back for it. So it obtains no access token. What it can do is force a logout, which is a nuisance rather than a compromise. Stated rather than mitigated: a CSRF token would be the fix, and it is not worth the machinery against an attack whose whole yield is signing somebody out.

**A misconfigured allowlist locks the frontend out** → Visible immediately as a failed sign-in with a CORS error in the browser console, which names the origin it wanted. Recoverable by editing one variable.

**The residual risk is unchanged in a same-site deployment** → Nothing about `Strict` changes, and it remains the default.

## Migration Plan

Additive configuration with safe defaults. An existing deployment that sets nothing behaves exactly as it does now. Rollback is reverting the commit.
