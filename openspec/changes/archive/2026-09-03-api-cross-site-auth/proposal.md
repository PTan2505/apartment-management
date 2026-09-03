## Why

The owner's application is finished and cannot be deployed, because signing in stops working the moment the frontend and the API are not on the same site — which is what deploying them to Vercel and Render means.

Two things break it, and fixing either alone leaves it broken:

- **The refresh cookie is `SameSite=Strict`.** A browser will not attach it to a request from a different site, so `POST /auth/refresh` arrives without it and the session cannot be renewed. Fifteen minutes after signing in, the owner is signed out.
- **CORS is wide open and carries no credentials.** `Access-Control-Allow-Origin: *` is what the API answers today, and a browser refuses to send credentials to a wildcard origin at all. So the cookie would be withheld even if it were `SameSite=None`.

The second is worth noticing on its own account. A wildcard origin means any page on the internet may call this API from a visitor's browser. Nothing leaks today — the access token travels in a header rather than a cookie, so a hostile page has no credential to ride on — but it is a permission granted for no reason, and it is the reason the cookie fix cannot work.

## What Changes

- **The origins allowed to call the API are named** rather than left as a wildcard, and credentials are permitted from them. Both surfaces need naming: the owner's application and the tenant portal are deployed separately.
- **The refresh cookie's `SameSite` becomes configuration**, defaulting to the current `Strict`. Deploying across sites is a decision about where things are hosted, and the API cannot infer it — so it is stated rather than guessed.
- **`SameSite=None` is refused without `Secure`.** Browsers ignore that combination anyway; failing at startup says so, rather than leaving an owner to discover it as a login that silently does not work.
- **In development, nothing changes.** No origins configured means the permissive behaviour that local work depends on.

Deliberately NOT in this change:

- **Deploying anything.** This removes the obstacle; the deployment itself needs accounts and secrets.
- **Rotating refresh tokens, or adding a CSRF token.** With the origins named, a hostile page can cause a refresh but cannot read its response, so it gains nothing. See design.md — the residual risk is stated rather than papered over.
- **The tenant portal's own auth**, which carries a token in a header and never used a cookie.

## Capabilities

### Modified Capabilities

- `auth`: the refresh cookie's cross-site behaviour is configurable, and unsafe combinations are refused at startup.
- `api-infrastructure`: the API names the origins it accepts browser requests from, instead of accepting all of them.

## Impact

- `backend/src/config/env.ts` and `backend/.env.example` — the new settings.
- `backend/src/server.ts` — the CORS policy.
- `backend/src/modules/auth/controller.ts` — the cookie options.
- No change to what any endpoint does, or to how a session is validated.
