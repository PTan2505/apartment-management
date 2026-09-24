## 1. The token belongs to a tenancy

- [x] 1.1 `LeasePortalToken` replaces `TenantAccessToken`, with a migration
- [x] 1.2 Existing tenancies are back-issued a link
- [x] 1.3 Creating a tenancy issues its link in the same transaction, renewal included

## 2. Readable again

- [x] 2.1 The token is kept encrypted beside its hash, keyed from the application secret
- [x] 2.2 A presented token is still found by hash alone
- [x] 2.3 An undecryptable token reports "exists, cannot be shown" rather than failing

## 3. The API

- [x] 3.1 `GET|POST|DELETE /leases/:id/portal-link`, owner-only
- [x] 3.2 `/customers/:id/portal-link` removed
- [x] 3.3 The portal shows the bills of its own tenancy, and pays only those

## 4. The screen

- [x] 4.1 The tenancy screen shows the link, with copy, reissue and withdraw
- [x] 4.2 Reissue and withdraw confirm first, and say what they break
- [x] 4.3 The screen says what the link grants

## 5. Strings

- [x] 5.1 New Vietnamese strings reported for review

## 6. Checks

- [x] 6.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`
- [x] 6.2 The portal still opens from a real link, shows that tenancy's bills, and starts a payment
- [x] 6.3 A withdrawn link stops working; a reissued one works and the old one does not
- [x] 6.4 Verified in a visible browser at 1440px and 390px, owner screen and portal
