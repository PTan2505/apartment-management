## Context

See proposal.md — Why. What shapes the approach, all checked rather than assumed:

- `Invoice` requires `year`, `month`, `periodStart`, `periodEnd`, `previousElectricityUse` and `currentElectricityUse`. All six are true of a monthly bill and false of a move-in one.
- `InvoiceLineItem` has no period. A monthly bill is about to carry two.
- `InvoiceType` already holds all four kinds; `issueDate` already exists. The previous change put them there without moving a figure.
- `computeCharges` prorates by one `OccupiedPeriod`. Rent will need a different one from water.
- `computeServiceFeeCharges` already intersects two windows, so the shape rent now needs exists.
- Lease creation and move-out are each already a transaction — the lease with its primary occupant, the move-out with its occupant departures.
- The revenue report reads exactly one column, `totalAmount`. That stops being sufficient here.

## Goals / Non-Goals

**Goals:**

- Bill rent before the month it covers, and collect the deposit that was only ever recorded.
- Close a tenancy with a bill rather than silence.
- Give the owner the decision about days no agreement covers.

**Non-Goals:**

- Returning a deposit, or carrying it to a renewal. The change that follows.
- Reporting deposits held, or grouping revenue by issue date. Also the change that follows.
- Rewriting invoices already issued.

## Decisions

### The revenue report stops reading `totalAmount`

For three changes the report read one column, and that was the cheapest proof each of them had moved only what it claimed. It cannot survive this one: an invoice charging a deposit and rent has a total larger than the revenue it represents, so the total is no longer the answer to "what did this earn".

The report therefore sums the charges on an invoice, skipping deposit lines. `totalAmount` stays — it is what the tenant owes, which is a real and different question.

Stated as a decision because it retires a property the last three changes leaned on, and someone reading them in order will expect it to hold.

### Rent and utilities are prorated against different months

`computeCharges` prorates everything by one period. Rent is now charged for the month *after* the one whose utilities sit beside it, so it needs its own.

The rent period is the part of the following month the lease covers — a full month in the ordinary case, part of one in the month a term ends. Water and service fees keep the period they have.

The alternative, prorating rent by the utilities month, is wrong in exactly the case that matters: a January invoice charging February's rent would reduce it for days *January* was not occupied, which has nothing to do with February.

### Optional columns rather than a separate table per kind

`year`, `month`, the period and the meter readings become nullable, and each kind states which it carries.

Splitting move-in and overdue invoices into their own tables would make the absences structural rather than conventional, and would then need every list, filter, payment and void path duplicated across tables. One table with kind-dependent nullability keeps one payment flow, one void flow, one listing — which is what an owner actually wants: a lease's bills in one place.

The cost is that nullability alone does not prevent a monthly invoice being written without a period. That is enforced in the service, not the schema, and the verification checks it.

### Both new invoices are issued inside the transaction that causes them

Creating a lease already writes the lease and its primary occupant together, on the reasoning that a lease without someone responsible for it is a half-recorded fact. The opening bill is the same kind of fact: a tenancy whose deposit was never charged is not a tenancy anybody has actually started.

Move-out is the same in the other direction. A closed tenancy whose last month was never billed loses that money silently, and the meter reading it needs is the one being recorded in that very request.

So both invoices are written in the transaction that causes them, and a failure rolls back the lease or the move-out with them.

### The overdue invoice's charges are chosen, not calculated

The owner picks each charge from the building's service fees and may set any amount.

Free text was the alternative and was rejected: a charge named "parking" one month and "Parking fee" the next cannot be grouped, compared, or reported on. Choosing from the catalogue keeps the name stable while leaving the amount free, which is the part that genuinely has no correct answer — no agreement covers those days, and the fee's current price is a fact about today rather than about them.

An overdue invoice with no charges is allowed. An owner waiving the extra days should produce a record saying so, not an absence.

### A monthly invoice is refused when its rent month is beyond the term

Billing January charges February's rent. If the term ends in January, there is no February to charge, and January's utilities belong on the final invoice instead.

Refusing rather than silently omitting the rent line matters: an invoice with no rent is what a *final* invoice looks like, so producing one here would make two different things indistinguishable.

## Risks / Trade-offs

- **This is the change that moves money.** Everything a tenant pays and when. → It is why the last three were sequenced first: line items, service fees and invoice kinds each landed with a "nothing moved" check, so anything that moves now moved because of this and not because of them. There is no equivalent check available here; the verification instead pins each figure to an arithmetic expectation stated in advance.

- **Rent proration against the wrong month is invisible.** A January invoice charging February's rent, prorated by January's occupancy, produces a plausible number. → Verified specifically: a lease starting mid-January must have a *full* February rent on its January invoice, and the move-in invoice must carry the partial one.

- **Lease creation now issues money.** A mistyped rent produces an issued invoice, which must be voided rather than corrected. → Accepted deliberately for symmetry with move-out, and flagged when the decision was made. The invoice is voidable and the lease editable, so the recovery path exists.

- **Nullable columns weaken a guarantee the schema used to make.** A monthly invoice could be written without a period. → Enforced in the service and verified, but worth naming: this trades a database guarantee for a code one.

- **`billed` must still equal `collected` plus `outstanding`.** Excluding deposit lines from all three keeps the identity, but only if applied consistently. → Checked directly rather than assumed, including on a move-in invoice that is paid.
