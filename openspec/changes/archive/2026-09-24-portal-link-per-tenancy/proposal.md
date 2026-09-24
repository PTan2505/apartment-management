## Why

The owner has no way to give a tenant their payment link. The API can issue one;
nothing on any screen calls it, so in practice the portal is unreachable.

Adding a button would not be enough, because of what the link currently is. A
token belongs to a PERSON, is returned once, and is stored hashed — so it can
never be shown again, and issuing a new one silently kills the link that person
is already using. Under those rules "open a tenancy and see its link" is
impossible: a link issued automatically when the tenancy was signed would be a
link nobody ever saw, and a renewal would break the tenant's working link.

The owner's decision is that the link belongs to the TENANCY: one payment link
per lease, and whoever holds it can pay that tenancy's bills.

## What Changes

- A portal link belongs to a tenancy rather than to a customer. Signing a
  tenancy issues its link; the tenancy screen shows it, with copy, reissue and
  withdraw.
- An issued link can be read back. The token is kept encrypted rather than
  hashed-only, under a key derived from the application secret, so a copy of the
  database alone is still not a copy of every link.
- The portal shows the bills of the tenancy the link was issued for — all of
  them, paid and unpaid, voided ones excluded.
- **Removed**: the per-customer link and its three endpoints under
  `/customers/:id/portal-link`. Nothing on any screen used them, and two notions
  of who a portal link belongs to is one too many.
- Consequence the owner accepted: anyone holding a tenancy's link can see that
  tenancy's bills and pay them. It is a payment link, not a sign-in.

## Impact

- Affected specs: `tenant-portal`, `web-leases`
- Affected code: `backend/prisma/schema.prisma` (+ migration),
  `backend/src/modules/tenant-portal/*`, `backend/src/modules/leases/service.ts`,
  `backend/src/modules/customers/router.ts`, `backend/src/lib/opaque-token.ts`,
  `frontend/src/features/leases/*`, `frontend/src/features/portal/*`
