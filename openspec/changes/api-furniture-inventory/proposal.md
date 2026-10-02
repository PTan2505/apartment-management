## Why

A room is handed over with a bed, a fridge, an air conditioner. The system records none
of it, so three questions have no answer.

**What is in room P101?** Nobody can say without walking into it.

**What did this tenant receive?** At the end of a tenancy the two sides remember
differently, and there is no record to settle it. The scratch on the wardrobe was either
there on day one or it was not.

**What is a broken fridge worth?** The owner keeps part of the deposit and the tenant
asks on what basis. The system has a place to charge for it — an ad-hoc invoice — and
nothing to put in the amount.

## What Changes

- **A catalogue of furniture per building**, the way service fees already work: a name, a
  kind, a make, and a price. Declared once, chosen many times.
- **A room holds its furniture.** Chosen from the catalogue, with a quantity, a price
  copied at that moment, and its condition. Entered ONCE — the fridge does not leave when
  the tenant does, so a new tenancy must not mean retyping eight items.
- **Signing a tenancy freezes a hand-over record.** What this tenant received, at what
  value, in what condition, on what date. Frozen because the room's furniture goes on
  changing and the record must keep saying what was true at hand-over.
- **Condition is a fixed set, not free text** — new, good, worn, damaged — with a note
  beside it. "Hơi xước" and "xước nhẹ" are the same condition and would otherwise be two.
- **Closing a tenancy checks the furniture back in.** Each item on the hand-over record
  gets a condition at return, beside the condition it was handed over in. That comparison
  is the whole reason a condition at hand-over is recorded at all.
- **Damage becomes an ad-hoc invoice**, with the amount prefilled from the hand-over
  value. NOT a deposit deduction: the system already refuses a second, weaker place to
  record money kept back, and this change does not add one.

## Capabilities

### New Capabilities

- `furniture`: what a building offers, what a room holds, what a tenant received, and what
  came back.

### Modified Capabilities

- `web-rooms`: a room's page lists its furniture and lets the owner maintain it.
- `web-leases`: a tenancy shows its hand-over record, and closing one checks the items
  back in and offers to charge for what is damaged.

## Impact

- Affected specs: `furniture` (new), `web-rooms`, `web-leases`
- Affected code: `backend/prisma/schema.prisma` (three tables and one enum, + migration),
  a new `backend/src/modules/furniture/*`, lease creation (to freeze the record), the
  move-out path (to check items in), and the room and tenancy screens
- **No change to how invoices work.** Damage uses the ad-hoc invoice that exists; this
  change supplies the amount, not a new way to charge.
- **No change to deposits.** Explicitly: keeping money back still goes through an invoice.
- The largest of the four changes, and the one whose data model is hardest to move later.
