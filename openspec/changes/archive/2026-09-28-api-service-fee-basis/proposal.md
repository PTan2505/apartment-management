## Why

A service fee charges one amount per tenancy, times a quantity somebody types. That
covers a motorbike space. It does not cover the fees an owner actually has most of:
rubbish and water-like charges that scale with how many people live in the room.

Today the only way to bill those per person is to type the head count into the quantity
box and remember to change it whenever somebody moves in or out. Nothing reminds
anybody, and the charge is wrong quietly — which is the same failure the system already
avoids for water, by reading the tenancy's occupant count at billing time instead of
storing a number.

Separately, a fee every room pays has to be attached room by room. A building with
fifty-eight rooms is fifty-eight chances to miss one, and a missed one is money the
owner never learns they did not bill.

## What Changes

- A service fee records **what it is charged per**: `perRoom`, the flat amount it is
  today, or `perPerson`.
- A `perPerson` fee is billed as its amount times the tenancy's occupant count **read at
  billing time**, exactly as water already is. Somebody moving in raises next month's
  bill with nothing to remember. No quantity is asked for such a fee — the head count is
  the quantity, and asking for both would multiply twice.
- A fee records whether it is **applied to new tenancies by default**. A tenancy signed
  afterwards picks up every default fee its building offers, at the price and basis of
  that moment. It can still be taken off that one tenancy.
  - Tenancies that ALREADY exist are untouched. Marking a fee as default is a statement
    about what is agreed from now on, not a retroactive charge.
- A tenancy copies the basis alongside the price it already copies, so changing a fee
  from per-room to per-person never reaches back into an agreement already made.
- **BREAKING for nobody**: existing fees become `perRoom`, not applied by default, which
  is exactly what they are now.

## Capabilities

### New Capabilities

(None.)

### Modified Capabilities

- `service-fee`: a fee states what it is charged per and whether new tenancies take it
  up automatically; a tenancy's selection carries the basis it agreed.
- `invoice`: a per-person fee is charged against the tenancy's occupant count.
- `lease`: signing a tenancy takes up its building's default fees.
- `web-buildings`: the fee form asks what the fee is charged per, and whether it applies
  to new tenancies by default.
- `web-leases`: a per-person fee shows the head count it is billed against instead of a
  quantity box.

## Impact

- Affected specs: `service-fee`, `invoice`, `lease`, `web-buildings`, `web-leases`
- Affected code: `backend/prisma/schema.prisma` (a new enum, two columns on
  `BuildingServiceFee`, one on `LeaseServiceFee`, + migration),
  `backend/src/modules/service-fees/*`, the fee arithmetic in
  `backend/src/modules/invoices/billing.ts`, lease creation in
  `backend/src/modules/leases/service.ts`, and the two screens built by
  `web-service-fees`
- Ships after `web-service-fees`, which is what made any of this reachable.
