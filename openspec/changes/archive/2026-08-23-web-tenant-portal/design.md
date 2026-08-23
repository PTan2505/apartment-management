## Context

See proposal.md — Why. What shapes the approach, read from the code and confirmed against the live gateway:

- The owner's application sets `baseURL: '/api'` and relies on a Vite proxy that also rewrites the refresh cookie's path from `/auth` to `/api/auth`. Without that rewrite the cookie is stored for a path the application never calls, and every reload logs the owner out.
- That cookie is `httpOnly; Secure; SameSite=Strict`. Cross-site it is simply not sent, so the owner's application cannot be served from a different origin to the API as it stands.
- The portal's own API takes its token in an `Authorization` header and sets no cookie. It is indifferent to origins, and the backend already answers with open CORS.
- `POST /portal/invoices/:id/pay` returns `{ paymentId, qrCode, checkoutUrl }`. The gateway's reply carries twelve fields; the interface that reads it declares three, so the rest are discarded before anything sees them.
- The shared API client installs an interceptor that refreshes the session on `401`.
- Money already arrives as JSON numbers rather than strings — the backend overrides `Decimal.toJSON` — so no client-side parsing is involved.

Confirmed by calling the live gateway during exploration:

- It returns `bin`, `accountNumber`, `accountName`, `amount`, `description`, `checkoutUrl`, `qrCode` and more.
- The account it returns is a **virtual** one, `VQRQALLES8976`, not the owner's `0334974582`. Decoding the `qrCode` payload shows that same virtual account inside it: it is how the gateway knows which attempt a transfer belongs to.
- `expiredAt` is `null`. Payment links do not expire on their own.
- `img.vietqr.io` accepts that non-numeric virtual account and returns a rendered PNG.

## Goals / Non-Goals

**Goals:**

- Make the payment work already built reachable by the person it was built for.
- Deploy a frontend, which has not happened yet.
- Keep the tenant's screen independent of the owner's, in bundle and in behaviour.

**Non-Goals:**

- Moving the owner's application to a static host. It needs its same-origin arrangement reproduced in front of the API first; separate change.
- Any tenant-initiated write beyond paying.
- Offline support, notifications, or a native application.
- A design system. This is one screen.

## Decisions

### A separate application, not a public route

Two reasons, and neither is tidiness.

The shared API client refreshes the session on `401`. A tenant has no session; a `401` on their screen would trigger a refresh that cannot succeed, on an endpoint whose cookie they do not have. Working around that inside a shared client means a flag that says "this request is not really authenticated", which is a thing that gets forgotten.

And a tenant opens the link on a phone, on mobile data, to read one bill. Serving them the whole owner application to do it is a page that takes seconds to become useful, for no benefit. It also hands them the shape of every screen they cannot reach, which is not a data leak but is information nobody decided to give.

The cost is duplication: money formatting, the theme, an error shape. Small, and static — none of it changes often.

### The token: fragment in, session storage after

The link carries `#t=…`. A fragment is never transmitted, so the token reaches no access log, no proxy and no referrer on the way in. That was decided when the API was built; this is the client half of it.

Removing it from the address bar afterwards covers what the fragment does not — history, bookmarks, and a screenshot of the address bar, which is a thing people send each other. Done with `history.replaceState` so nothing navigates.

Kept in `sessionStorage` rather than memory, because otherwise a reload — or a phone browser evicting a background tab — locks the tenant out of a link they can no longer see in the address bar. Session storage rather than local storage: it is scoped to the tab and cleared when the browser is closed, which matches how long a tenant is actually looking at a bill.

The residual risk is stated rather than hidden: the token is on disk while the tab is open. Against the alternative — a tenant unable to reload — that is the better trade for a screen that shows one person's own bills.

### The QR is an image from a third party, and that is a real cost

The code is rendered by fetching `img.vietqr.io` with the bank, the account, the amount and the description the gateway returned.

Drawing it in the browser from the gateway's `qrCode` payload was the alternative and produces a plain black-and-white square. What the third party returns is the format Vietnamese tenants recognise: the bank's mark, the account name and the amount printed beneath, so they can check what they are about to send before they send it. For a screen whose entire job is convincing somebody it is safe to transfer money, that is not decoration.

What it costs is honest to name: a payment screen that fails when somebody else's service does, and the account, amount and description travelling to them in a URL. The first is mitigated by showing the gateway's checkout link beside the code — always, not only on failure, because a tenant who prefers to pay in a browser should not have to wait for an image to fail first. The second is mild: the account is single-use, and neither the amount nor the description is secret.

**The account must be the gateway's, never the owner's.** This is the one way to get it catastrophically wrong: a code pointing at the owner's real account is scannable, transfers money, and is invisible to the gateway — so no confirmation is ever sent and the bill stays unpaid with the money already gone. It is written into the spec as a requirement rather than left as an implementation detail.

### Polling, because there is nothing to be returned to

A tenant scanning the code in their banking application never visits the gateway's page. `returnUrl` and `cancelUrl` are never used. Nothing tells the portal the money moved except asking.

So after a payment is started the portal asks the API, every few seconds, until the bill reports itself paid. The API answers from its own database — the webhook is what writes it — so this is cheap and touches the gateway not at all.

It stops on success, and it stops after a few minutes. A tab left open on a bus for an hour must not be asking on the minute for that hour; there is an explicit way to start again instead.

### The first-load message

The API is hosted where an idle service is suspended and takes around fifty seconds to wake. A tenant opening a link after a quiet night gets that on their first request.

Fifty seconds of a spinner is indistinguishable from a page that has failed, and the tenant closes it. So the screen says loading may take a moment, before the wait rather than after it.

This is a property of the deployment rather than of the software, and it will stop being true on a paid plan. It is specified anyway, because the deployment is what a tenant meets.

## Risks / Trade-offs

- **The QR may not be what the gateway would have produced.** The image renders and looks right, but whether its encoded payload matches the gateway's own `qrCode` byte for byte is not established — reading it back would mean decoding a PNG. → Only a real transfer scanned from this image proves it. That is a verification task, not a reasoning one, and it is written as one.

- **A third party in the payment path.** → The checkout link is shown beside the code always. If `img.vietqr.io` proves unreliable in practice, drawing the gateway's payload in the browser is a contained change: the payload is already returned.

- **A second application to keep in step.** Money formatting and the error shape are duplicated. → Both are small and stable. The alternative — sharing them through the owner's application — reintroduces the coupling this separation exists to avoid.

- **`expiredAt` is null, so `expired` may be unreachable.** The state exists because a gateway might expire a link; this one does not. → Left as is. Removing a state because one provider does not use it is a guess about the next one, and it costs nothing to leave.

- **The token is on disk while the tab is open.** → Accepted, and named. It is scoped to the tab, cleared with the browser, and grants sight of one person's own bills.

## Migration Plan

1. Extend what the pay endpoint returns. Purely additive; nothing reads the response but this new application.
2. Build the portal as its own entry, with its own API address supplied at build time.
3. Deploy it to a static host. Nothing existing is touched — the owner's application is not built, moved, or configured differently.
4. Rollback is not deploying it. The API change is additive and harmless on its own.
