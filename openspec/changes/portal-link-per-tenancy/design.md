## Context

A portal token today is a row in `TenantAccessToken` against a `userId`, stored
as SHA-256, returned once. What it may see is computed from `LeaseOccupant`:
everything of a tenancy you occupy, and the unpaid bills of one you have left.
No screen issues one.

The owner's decision moves the link to the tenancy, and requires that the owner
can read it back at any time.

## Goals / Non-Goals

- Goal: an owner can copy a tenancy's payment link from the tenancy screen at
  any time, without replacing it.
- Goal: the portal's visibility rule becomes a property of the token rather than
  a query over occupancy.
- Non-Goal: identity. Anyone holding the link can pay; the owner chose this over
  a link per occupant.
- Non-Goal: keeping the per-customer link alongside. Two answers to "whose link
  is this" is how the two drift apart.

## Decisions

### The token is stored twice: a hash to find it, a ciphertext to show it

Lookup stays SHA-256 and unique-indexed — a public endpoint answers with one
indexed equality and no key operation, and the hash is what a stolen database
alone yields. Beside it, the same token encrypted with AES-256-GCM, which is
what the owner's screen reads back.

Storing only the ciphertext would mean decrypting rows to find one, or keeping a
deterministic encryption that is a hash with extra steps.

### The key is derived from `JWT_SECRET`, not a new environment variable

HKDF-SHA256 over the existing secret with a fixed salt. No new variable to set
on two deployments, and no second secret to lose; the secret it derives from is
already the one whose leak is catastrophic.

The trade-off, stated rather than hidden: rotating `JWT_SECRET` makes existing
tokens undecryptable. Links keep WORKING — lookup is by hash — but the owner can
no longer read them back, and the screen says so and offers to reissue. That is
the right failure: nothing breaks for a tenant mid-payment.

### The link is issued with the tenancy, inside the same transaction

A tenancy without a link would be a tenancy whose tenant cannot pay, discovered
later by somebody wondering why there is no link to send. Renewal creates a
tenancy through the same path and therefore gets one too.

### The portal's response keeps its shape, with a nullable name

`tenant: { fullName, phone }` becomes the tenancy's signatory, which may be
absent — a tenancy can have nobody named on it. The portal screen already
handles a missing name for other reasons; the API reports null rather than a
placeholder, because inventing "Khách" would state something untrue on a
document about money.

### The link is composed by the application, not the API

The API returns the token. The owner's screen builds `…/portal#t=<token>` from
`VITE_PORTAL_URL`, falling back to its own origin — the portal is a route in the
same application. The API has no business knowing the URL its clients are served
from, and a wrong value there would be invisible until a tenant opened a link.

## Risks / Trade-offs

- **A link is a bearer credential with no expiry.** Whoever it is forwarded to
  can see and pay those bills. Mitigated by scope — one tenancy, no personal
  data beyond a name and a room — and by reissue, which kills the old one. The
  owner accepted this explicitly.
- **A tenant with two tenancies now has two links.** Correct under the new
  model, and worse for that tenant than one link showing both. Accepted: the
  link is per agreement, as the owner asked.
- **Existing tokens stop working** at the migration, since the table is replaced.
  The hosted database has none, and local ones are disposable.

## Migration Plan

1. Replace `TenantAccessToken` with `LeasePortalToken` (leaseId, tokenHash,
   tokenCipher, revokedAt, lastUsedAt) in one migration. No data is carried:
   there is none in production, and a per-person token has no tenancy to belong
   to.
2. Back-issue a link for every tenancy that has none, so existing local and
   hosted tenancies are not left unreachable.
