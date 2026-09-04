## Context

See proposal.md — Why. What exists:

- `src/portal/` holds `main.tsx` (its own React root), `PortalApp.tsx`, `InvoiceCard.tsx`, `PaymentPanel.tsx`, `api.ts` and `token.ts`.
- `portal/api.ts` addresses the API absolutely through `__PORTAL_API_URL__` and carries the token in a header. It has no interceptor and touches no cookie.
- `token.ts` reads `#t=…` from the fragment and replaces it out of the address bar.
- The owner's router nests everything under `AuthProvider` → `ProtectedRoute` → `AppShell`, with `/login` deliberately outside the guard.
- Bundles today: owner 891 KB, portal 355 KB.

## Goals / Non-Goals

**Goals:**

- One application, one build, one API address.
- A tenant still downloads roughly what they download now, and none of the owner's screens.
- No change to anything the portal does.

**Non-Goals:**

- Changing the token, the link, or any portal behaviour.
- Sharing the API client.

## Decisions

**A plain route, and the tenant pays for it.**

Measured, because the original split named this as its reason and a claim about bytes deserves a number:

| | tenant downloads |
|---|---|
| Two builds (before) | 355 KB |
| One route, loaded on demand | 482 KB |
| One route, plain | 910 KB |

The middle row was built first. Splitting only the portal did nothing — React, MUI and all twelve owner screens sat in the entry chunk, so a tenant downloaded 891 KB plus a 20 KB portal chunk, which is worse than the arrangement being replaced. Making every screen lazy, the owner's shell included, brought it to 482 KB.

It was then removed on request: the difference was judged small against the machinery, for a page a tenant opens a few times a month. That is a reasonable call and it is recorded here with its price, because the price is the whole of what the original split bought.

Reversing it is a small change — dynamic imports in one file — if the number ever starts to matter.

**Outside AuthProvider, not merely outside the sign-in guard.**

The guard redirects anyone without a session, so the portal has to sit outside it — but that is not far enough. `AuthProvider` asks the API who is signed in the moment it mounts, and for a tenant the answer is nobody: the request is refused, the client then attempts a renewal, and that is refused too. Two round trips on a phone before a bill appears, for a question the tenant has no business being asked.

So it is a route at the very top, above everything that assumes an owner.

**The portal keeps its own API module, unchanged.**

The first reason for the split was that the owner's client renews a session on refusal and a tenant has none. That reason survives the merge and is satisfied the same way it is today — by not sharing the client. Nothing is gained by also not sharing an application.

**One address, taking the owner's.**

`__PORTAL_API_URL__` and `__API_URL__` name the same API. Keeping both would mean two settings that must agree and nothing to notice when they do not. The portal's module reads the application's address instead.

The build-time refusal is unchanged and now covers both: the application will not build without an address, and the portal cannot be left pointing somewhere else because there is no "somewhere else" to point.

**The second build goes entirely.**

Config, entry, scripts, CI step and example env file. Leaving any of them would leave a way to produce a second bundle that nothing deploys and nobody checks.

## Risks / Trade-offs

**A tenant's first paint waits for a chunk to load** → It waits for a smaller chunk than the file it downloads today, on a route that already tells the reader the API may take seconds to wake. A loading state exists and is already required.

**Someone imports an owner feature into the portal folder and drags it into the tenant's chunk** → Possible, and invisible without looking. The portal already imports one shared thing deliberately — the charge labelling in `lib/` — and that is small. Nothing enforces this; it is the sort of thing a review catches.

**The owner's bundle grows by the router's reference to a lazy chunk** → Negligible, and the portal's own code is not in it.

## Migration Plan

The portal's URL changes from `portal.html#t=…` to `/portal#t=…`. Nothing has been deployed and no link has been sent to a tenant, so no existing link breaks. The backend returns a token and never a URL, so nothing there changes.
