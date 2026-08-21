## Why

Every invoice this system issues is the same kind of thing: a month of occupancy, billed. The billing rework about to follow needs four kinds, and they do not all fit the shape the invoice has now.

- A **move-in** invoice charges a deposit and the first month's rent, and has no utilities at all.
- A **monthly** invoice charges the utilities of the month that ended and the rent of the month beginning.
- A **final** invoice charges utilities to the tenant's departure and no rent.
- An **overdue** invoice charges whatever the owner decides for days beyond the agreed term, since no agreement covers them.

An invoice is currently identified by the lease and the calendar month, and that is also what stops the same month being billed twice. With four kinds, one lease and one month can legitimately carry more than one invoice — a move-in and a monthly can both belong to January — so identity and the duplicate guard have to come apart before any of them exist.

Doing that first, while every invoice is still a monthly one, means it can be verified by a check that leaves nothing to interpret: every invoice generated afterwards is identical to the one the same inputs produced before, down to the currency unit. Only its description of itself is new.

## What Changes

- Record what kind of invoice each one is. Every invoice today is a monthly one, and every invoice this change produces still is.
- Record the date an invoice was issued, which is when the owner billed it rather than the period it covers. It defaults to the moment of issue and may be supplied, for a month billed late.
- Narrow the duplicate guard to monthly invoices, so that a lease and month may later hold a move-in or a final invoice as well without either being mistaken for a second monthly one.
- Keep the calendar month meaning what it means today: the period whose utilities the invoice covers. That does not change here and does not change in the billing rework either — what changes there is which month's *rent* sits beside them.
- **No change to any amount.** Rent, electricity, water and service fees are calculated and charged exactly as before.

Deliberately out of scope:

- **The other three kinds.** Nothing issues a move-in, final, or overdue invoice yet. This change makes room for them.
- **Rent in advance, deposits, the revenue report.** The two changes that follow.
- **Reporting by issue date.** The field is recorded and returned; nothing groups by it until the report change.

## Capabilities

### Modified Capabilities

- `invoice`: an invoice records its kind and the date it was issued, and the one-per-month rule applies to monthly invoices specifically.

### New Capabilities

None.

## Impact

**Database.** Two columns on `Invoice` — its kind and its issue date — and the partial unique index narrowed to monthly invoices. Existing rows backfill to monthly, issued on the date they were created, which is what they are.

**Code.** Generation records both fields and reports them. Nothing else moves.

**Behaviour that changes.** Nothing an owner would notice, beyond two extra fields on the response. That is the point, and it is what the verification checks.

**Existing invoices.** Untouched except for gaining the two fields, both derived from what they already are.

**Downstream.** The billing rework issues three kinds this makes room for, and the report change groups by the issue date this records.
