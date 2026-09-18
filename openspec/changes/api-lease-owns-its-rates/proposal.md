## Why

A tenancy already carries the rent it was agreed at: `Lease.baseRent` is copied from the
room when the tenancy is signed, and raising the room's rent afterwards leaves every
running tenancy alone. The electricity and water rates do not work that way. They are read
from the building at the moment an invoice is calculated, so editing a building's rates
silently re-prices every tenancy in it — including bills for months already lived, whenever
the next invoice for them is issued.

That is the wrong default for a rate the tenant agreed to, and it is invisible from the
edit form, which says nothing about who the new figure will reach.

## What Changes

- A tenancy records the electricity and water rates it was signed at, copied from its
  building exactly as the rent already is, and every charge against that tenancy is
  computed from the tenancy's own figures.
- Existing tenancies keep billing the same amounts: the migration copies each building's
  current rates onto them, which is what the next invoice would have used anyway.
- Editing a building's rates says plainly that the new figures apply to tenancies signed
  from now on and to nothing already signed.
- A running tenancy's own rates can be corrected, so bringing one onto a new price does
  not require renewing it early.
- Signing a tenancy fills the agreed rent from the room chosen, beside the opening meter
  reading it already filled, instead of leaving a blank field explained by a note.
- Vacancy electricity — the owner's own cost for an empty room — keeps using the
  building's current rate, because no tenancy exists to have agreed anything.

## Capabilities

### Modified Capabilities

- `lease`: a tenancy records the rates it was signed at
- `invoice`: charges are computed from the tenancy's rates, not the building's current ones
- `web-buildings`: the rate fields say who a new figure will reach
- `web-leases`: a tenancy's rates can be corrected from its terms dialog, and choosing a room fills what that room answers

## Impact

- `backend/prisma/schema.prisma` and a migration that backfills existing tenancies
- `backend/src/modules/leases/service.ts`, `invoices/{issue,service,billing}.ts`
- `frontend/src/features/buildings/BuildingFormDialog.tsx`
- Expenses are untouched: vacancy electricity has no tenancy behind it
