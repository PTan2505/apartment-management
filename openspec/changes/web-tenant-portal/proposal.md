## Why

A tenant can be sent a link, open it, read their bill down to the meter reading, scan a code and pay — and none of that is reachable, because there is no page. The API does all of it; the only client that has ever exercised it is `curl`.

The payment work was verified with two real transfers made by hand. A tenant cannot do that. Until there is a screen, the whole of it — the portal token, the itemised bill, the QR, the webhook, the caught lost confirmation — is a feature nobody can use.

It is also the only frontend this project can deploy today. The owner application reaches its API through a development proxy that makes requests same-origin, which is what lets an `httpOnly; SameSite=Strict` refresh cookie work at all. The portal has no cookie: its token travels in a header, so it is indifferent to origins.

## What Changes

**A separate application, not another route**

- **Add a second browser application** for tenants, built and deployed on its own.
- Kept apart from the owner's rather than added as a public route inside it, for two reasons that are not aesthetic: the shared API client refreshes a session on `401`, which a tenant has no session to refresh; and a tenant opening a link on a phone would otherwise download the whole of the owner's application to read one bill.

**Opening a link**

- The token arrives in the URL **fragment** and is removed from the address bar as soon as it is read, so it does not sit in history or in a screenshot.
- It is held for the session so a reload does not lock the tenant out.
- Where the token is missing, unknown or withdrawn, the page says the link is no longer valid — the same answer for all three, because the API deliberately gives no more.

**Reading a bill**

- Every bill the token can see, newest first, each showing what it is, when it was issued, what it totals and whether it is paid.
- Opening one shows the charges that make it up: the rent and the month it is for, the meter readings and the rate applied, the water and the head count, each service fee.

**Paying one**

- **Add a QR** for an unpaid bill, rendered from the bank details the gateway returns, alongside a link to the gateway's own page as a fallback.
- **The API must return those details**, which it currently discards: the bank, the account the gateway allocated for this attempt, the name, the amount and the description.
- After the code is shown, the page **asks the API** whether the bill has been paid — because a tenant who scans it in their banking app never visits the gateway's page and is never redirected back.

**Deployment**

- The application is built to be served from a static host and to call the API by an absolute address, since it has no proxy in front of it.

Deliberately out of scope:

- The owner's application, and moving it to a static host. That needs the same-origin arrangement it depends on today to be reproduced in front of the API, which is its own change.
- Any tenant-initiated action other than paying. No messages, no corrections, no requests.
- Logging in. There is nothing to log into.

## Capabilities

### New Capabilities

- `web-tenant-portal`: the tenant's own screen — opening a link, reading a bill in full, and paying it.

### Modified Capabilities

- `tenant-portal`: starting a payment returns the bank details a QR can be built from, not only a code and a link.
- `web-infrastructure`: the same-origin requirement is scoped to the application that carries a session cookie, now that one exists which does not.

## Impact

**Frontend.** A second application. It shares the design language and the money formatting with the owner's, and none of its data fetching.

**Backend.** One response gains fields the gateway already returns and the code currently drops on the floor.

**Behaviour that changes.** Nothing existing. No endpoint changes what it accepts, and no screen the owner uses is touched.

**A dependency of a kind this project has avoided.** The QR is an image fetched from a third party at display time. It is chosen over drawing one in the browser because it renders the format Vietnamese tenants recognise, with the bank's marks and the amount in words they can check before paying — but it means a payment screen that depends on somebody else being up. The gateway's own checkout link is offered beside it for that reason.

**Deployment.** The first frontend to be deployed at all.
