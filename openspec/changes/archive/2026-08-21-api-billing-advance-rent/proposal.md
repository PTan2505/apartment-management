## Why

Rent is billed for the month that has just been lived in. The owner wants it billed for the month about to begin, which is how the tenancy is actually agreed: a deposit and the first month up front, then each month's utilities settled alongside the next month's rent, and a final bill for utilities alone once the rent has run out.

Three things follow, and none of them exists:

- **A move-in bill.** A deposit is recorded on the lease and never charged. The first month's rent has nowhere to be billed from, because billing begins a month after the tenant moves in.
- **A final bill.** Recording a move-out closes the tenancy and issues nothing, so the last month's utilities are never charged.
- **A bill for days past the term.** A tenant may stay a few days beyond the agreed term with neither side wanting a renewal. No agreement covers those days, so nothing can be calculated for them — but the owner may still want to charge something.

The invoice cannot hold any of it yet. Its month, period and meter readings are all required, which is true of a monthly bill and false of a move-in one. And a monthly bill will carry two different periods at once — last month's utilities beside next month's rent — which its single period cannot express.

## What Changes

**Structure**

- Let an invoice omit what its kind does not have. A move-in bill has no utilities, so no month, no period and no meter readings. These become optional rather than required, and each kind states which it carries.
- Give each line item its own period, so a bill carrying January's utilities and February's rent says which is which on the line rather than leaving a reader to infer it.

**Billing**

- **Issue a move-in invoice when a lease is created**, charging the deposit and the first month's rent. A tenancy beginning partway through a month is charged for the remainder of it.
- **Charge rent one month in advance on a monthly invoice**: the utilities of the month named, and the rent of the month following. A monthly invoice may only be issued while the following month is still within the lease's term, because there is no rent to charge beyond it.
- Prorate the advance rent where the lease covers only part of that following month, which happens in the last month of a term that ends partway through one.
- **Issue a final invoice when a move-out is recorded**, charging utilities to the departure and no rent — the rent for that month was already paid a month earlier.
- **Issue a second, overdue invoice when the departure falls after the agreed term.** Its lines are chosen by the owner from the building's fees rather than calculated, because no agreement covers those days and the system has no basis to decide what they cost.
- Charge the deposit as its own kind of line, and **exclude it from revenue**. It is money held on someone else's behalf, and counting it would inflate the month a tenant arrives and leave a hole when it is returned.

Deliberately out of scope:

- **Returning the deposit, and carrying it to a renewal.** Both are the change that follows. This one collects it.
- **Reporting deposits held, or grouping revenue by issue date.** Also the change that follows. The exclusion above is included here only because landing a deposit charge while the revenue figure counts it would knowingly publish a wrong number.
- **Repairing invoices already issued.** Existing bills recorded what they charged and are not revisited.

## Capabilities

### Modified Capabilities

- `invoice`: an invoice carries only what its kind has; line items carry their own periods; rent is charged a month in advance; move-in, final and overdue invoices exist.
- `lease`: creating a lease issues its move-in invoice, and recording a move-out issues its final invoice and, where the departure is late, an overdue one.
- `revenue-report`: a deposit charge is not revenue.

### New Capabilities

None.

## Impact

**Database.** Several columns on `Invoice` become optional. Line items gain a period. A deposit line kind is added. Existing rows are unaffected: every one is a monthly invoice carrying everything it always did.

**Code.** Lease creation and move-out each issue an invoice. Invoice generation splits the period it bills from the period it charges rent for. The revenue report learns to skip one kind of line.

**Behaviour that changes, substantially.** What a tenant is charged and when. This is the change the last three were sequenced to make safe: line items, service fees and invoice kinds all landed without moving a figure, so anything that moves here moved because of this.

**Existing invoices.** Untouched.

**Downstream.** The deposit lifecycle change returns what this collects, and the report change reads the issue dates and deposits this records.
