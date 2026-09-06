## Why

`WEB_ORIGINS` is optional, and leaving it unset is documented as meaning "any origin". It does not mean that. A browser refuses to send credentials to a wildcard origin, so the permissive fallback permits no real client of this API — every one of them signs in, and signing in needs credentials.

This was found by serving a production build of the frontend locally against the API. The sign-in request never completed:

> The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '\*' when the request's credentials mode is 'include'.

Local development never noticed because it does not use CORS at all: the dev server proxies `/api`, so the browser is making same-origin requests. The fallback has therefore never been exercised by anything that works, while being described as the thing local development depends on.

It matters more now that the repository is public. `.env.example` ships `WEB_ORIGINS=` empty, so the documented starting point produces a deployment whose front end cannot sign in — and the failure appears only at the first sign-in, which is the most expensive moment to discover it.

## What Changes

- **BREAKING for a production deployment that has not set it**: the API SHALL refuse to start in production with no `WEB_ORIGINS` configured, rather than starting with a permission that permits nothing.
- Outside production, an unset `WEB_ORIGINS` SHALL allow the requesting origin **with credentials**, so a locally built bundle behaves as it will when deployed instead of failing in a way only the deployed version shows.
- `.env.example` SHALL stop presenting the empty value as a working configuration.

The refusal follows what this file already does: a partial PayOS configuration is refused at startup, and `CROSS_SITE_COOKIES` outside production is refused, both for the same reason — a setting that cannot work should fail where somebody is watching, not at a user's first sign-in.

## Capabilities

### Modified Capabilities

- `api-infrastructure`: the API states which browser origins it accepts, and refuses to run in production without them.

## Impact

- `backend/src/config/env.ts` — a cross-field refinement, beside the two already there.
- `backend/src/server.ts` — the CORS options.
- `backend/.env.example` — the comment and the value.
- **Deployment**: a production deployment with no `WEB_ORIGINS` stops starting. The current one sets it, so nothing in flight breaks; a new one now fails loudly instead of quietly.
- **Local development is unaffected** where it goes through the dev proxy, and improves where it does not.
