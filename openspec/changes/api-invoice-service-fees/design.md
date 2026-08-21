## Context

See proposal.md — Why. What shapes the approach, checked rather than assumed:

- `LeaseServiceFee` holds `unitAmount` (copied at selection), `quantity`, and nothing about time. Removing a fee calls `delete`.
- Its unique index is unconditional: `UNIQUE(leaseId, buildingServiceFeeId)`.
- `LeaseOccupant` already models exactly this shape — `joinedAt`, nullable `leftAt`, and a partial unique index on the active rows. `addOccupant` takes an optional `joinedAt`.
- `computeCharges` prorates rent and water by `daysOccupied / daysInMonth`, and never prorates electricity.
- `buildLineItems` produces the three lines from the charges, and `InvoiceLineKind` is an enum of exactly `rent | electricity | water`.
- A line item already carries a nullable `quantity` and `unitAmount` beside its authoritative `amount`.

## Goals / Non-Goals

**Goals:**

- Put the fees a lease agreed onto the bill it gets.
- Make "which fees applied during this period" answerable, including for an invoice generated late.

**Non-Goals:**

- Advance rent, invoice types, deposits, the revenue report. The billing change.
- Changing rent, electricity or water in any way. An invoice for a lease with no fees must be identical.
- Repricing a fee across running leases. That decision stands.

## Decisions

### An effective period, following `LeaseOccupant` rather than inventing a shape

`effectiveFrom` and a nullable `effectiveTo`, with the unique index becoming partial on `effectiveTo IS NULL`.

This is the same model the project already uses for a person joining and leaving a lease, down to the partial index that lets the same person rejoin later. Copying it means a reader who understands occupants understands fees, and it brings a capability the current design cannot express at all: a tenant who gives up parking and takes it again later.

The alternative — keeping the hard delete and accepting the gap — was already taken once and recorded as a limitation. It is being paid for now, before anything bills these fees, which is the cheapest moment it will ever have.

**`effectiveFrom` defaults to the lease's start date, not to today.** A fee agreed at signing applied from the tenancy's first day, and defaulting to the moment the owner happened to enter it would silently under-charge every fee entered late. `effectiveTo` defaults to today, because giving something up is a thing that happens when it happens.

### A fee is prorated by the overlap of two periods, not one

Rent and water are prorated by the tenancy's occupied days. A service fee needs the intersection of that with the fee's own effective window:

```
  occupied days in month   ∩   fee's effective period   =   days charged
```

A fee that ran all month over a full tenancy gets the whole amount. A fee given up on the 15th of a full month gets 14 days. A fee that ran all month over a tenancy that ended on the 10th gets the tenancy's days, because the tenant was not there for the rest.

Treating a fee like water — prorating by the tenancy alone — would charge a given-up fee for the whole month. Treating it by its own window alone would charge a departed tenant for days after they left. Both are wrong in the same invoice, so the intersection is not an optimisation; it is the rule.

### Which fees, decided by the billed period rather than by the present

The query asks which fees overlapped the period being billed, not which the lease holds now. This is the whole reason for storing the period, and it is what makes generating an invoice late produce what was true then.

It is worth stating because the tempting implementation — read the lease's current fees — passes every test where invoices are generated on time, and silently produces the wrong bill exactly when they are not.

### The line references the fee it came from

`InvoiceLineKind` gains `serviceFee`, and the line carries a nullable reference to the `BuildingServiceFee`.

The description alone would render a readable bill, but the reference is what lets a report later group by kind of fee — "how much parking did this building earn" — without parsing text. A building fee is retired, never deleted, so the reference cannot dangle.

Nullable because the other three kinds have no fee to point at, and because the billing change's overdue invoice will carry lines the owner wrote by hand.

### Backfill `effectiveFrom` from the lease's start date

For every row that exists, the fee was selected when the lease was created and applied from its start. There are no rows today, so the backfill converts nothing — but it must still be correct for a database that has them, and the lease's start date is the only defensible value.

## Risks / Trade-offs

- **The tempting wrong implementation looks right.** Reading a lease's current fees instead of the fees that overlapped the period passes every on-time test. → Verification includes generating an invoice for a month *after* a fee was given up, and one for a month *before* a fee was taken up. Neither passes under the wrong implementation.

- **Rent, electricity and water must not move.** A refactor near the charge computation could shift them by a rounding step. → An invoice for a lease with no service fees must be byte-identical to the baseline, and that is checked before anything with fees is examined.

- **Two periods intersecting is easy to get subtly wrong at the boundaries.** Off-by-one on either end changes money. → Verification pins the day counts explicitly: a fee given up on the 15th of a 31-day month is charged 14 days, and the arithmetic is checked rather than the shape of the response.

- **`effectiveTo` defaulting to today makes the result depend on when the request runs.** → Deliberate and matching `leftAt`, but the date may be supplied for anything historical, and the spec says so.
