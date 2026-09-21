## 1. Every tenancy has a reference

- [x] 1.1 Renewal sets the successor's reference, the same way signing does
- [x] 1.2 A migration back-fills every lease whose reference is null
- [x] 1.3 The frontend type admits null, and the screen says "not recorded" rather than rendering a blank

## 2. Three unused terms leave the system

- [x] 2.1 Dropped from `prisma/schema.prisma`, with a migration that drops the columns
- [x] 2.2 Out of the lease schema, the mapper and the frontend types
- [x] 2.3 Off the terms card, out of "Sửa điều khoản"

## 3. The terms card

- [x] 3.1 Reference and signing date, each labelled for what it is
- [x] 3.2 Rows spread across the card

## 4. The signing date is captured at signing

- [x] 4.1 A date field on the new-tenancy form, optional, sent as `handoverSignedAt`

## 5. A renewal records which lease it renewed

- [x] 5.1 `renewedFromId` on `Lease`, unique, self-referencing, with a migration
- [x] 5.2 Set at renewal, and both ends reported by the API
- [x] 5.3 Shown on the tenancy in both directions, each a link named by the agreement's reference
- [x] 5.4 Absent on a tenancy with no renewal — no row, not "chưa ghi nhận"

## 6. Strings

- [x] 5.1 New and changed Vietnamese strings reported for review

## 7. Checks

- [x] 7.1 `tsc --noEmit` both sides, lint, both builds
- [x] 7.2 Migrations applied locally; instructions for the hosted database

## 8. Verify in a visible browser

- [x] 8.1 A renewed tenancy shows a reference — renewal has no screen of its own, so it is exercised through the API and the resulting tenancy is read on the screen
- [x] 8.2 The terms card holds the reference and the signing date, and none of the three retired terms appears anywhere on the tenancy screens
- [x] 8.3 Signing a tenancy with the paper date records it and the tenancy shows it
- [x] 8.4 Signing without it still works, and the date reads as not recorded
- [x] 8.5 Rows measured across the card, at 1440px and 390px
- [x] 8.6 The renewal chain: both directions named and followed by clicking, absent where there is no renewal, at 390px
