## Why

The tenant portal is built and deployed as a separate application, and it has never been deployed at all. Its separateness has so far bought nothing and cost a second Vite config, a second entry point, a second build script, a second API address to configure, a second CI step, and a deployment story nobody has written.

It was separated for two stated reasons, and they are worth taking seriously rather than waving away:

- **The owner's API client renews the session on a 401, and a tenant has no session to renew.** Sharing it would mean a flag saying "this request is not really authenticated", which is the sort of thing that gets forgotten.
- **A tenant opens a link on a phone, on mobile data, to read one bill.** Shipping them the whole owner application is seconds of waiting for no benefit, and hands them the shape of every screen they cannot reach.

The first is already solved and not by separateness: the portal has its own API module, with no interceptor and no cookie, and keeping it is the whole of what that reason requires.

The second is real and measurable, and survives the merge: a tenant now downloads 910 KB where they downloaded 355. Loading the route on demand was built and measured at 482 KB, and then removed on request — the difference was judged not worth the machinery, and that is a legitimate call to make about a page opened a few times a month.

So one reason is met by keeping the portal's own API module, and the other is paid for.

## What Changes

- **The portal becomes a route in the owner's application**, outside anything that establishes an owner session, reached at `/portal` with the token in the fragment exactly as now.
- **It keeps its own API module.** No interceptor, no cookie, no session to renew — which is what the first reason actually asked for.
- **One API address instead of two.** `VITE_PORTAL_API_URL` goes; the portal uses the address the application already has.
- **The second build goes**: its config, its entry, its build and dev scripts, its CI step, and its example environment file.

Deliberately NOT in this change:

- **Anything the portal does.** Every screen, every figure and every refusal behaves as it does now.
- **The token's shape or its route into the browser.** It still arrives in the fragment, is still swapped out of the address bar, and the backend still returns only a token.

## Capabilities

### Modified Capabilities

- `web-tenant-portal`: the portal is a route in the owner's application, loaded on demand, sharing its API address.

## Impact

- `frontend/src/app/router.tsx` — the route.
- `frontend/src/portal/` — its entry point folds into the route; the rest is unchanged.
- `frontend/vite.portal.config.ts`, `frontend/portal.html`, `frontend/.env.portal.example` — removed.
- `frontend/package.json` — two scripts removed.
- `.github/workflows/ci.yml` — one build step removed.
- No backend change.
