## Why

A building can define what it charges for beyond rent and utilities, and a lease can record which of those it agreed to and at what price. None of it reaches a bill. The owner configures parking, internet and rubbish, enters what each tenant takes, and the invoice never mentions any of it.

There is also a gap underneath. A lease's service fees are its *current* selection, with no history: removing one deletes the row. A tenant who had parking for the first half of March and gave it up loses that fact entirely, so an invoice generated afterwards charges nothing for the days they had it. That was recorded as a known limitation when the selections were built, on the understanding that it would be confronted when something actually billed them. This is that change.

Doing it before the billing rework is deliberate. Adding charges to an invoice whose rent is calculated the way it always has been can be verified by a check that leaves nothing to interpret: every total moves by exactly the service fees added, and nothing else moves at all.

## What Changes

- Charge a lease's service fees on its invoices, as line items alongside rent, electricity and water.
- Prorate a service fee the way water is prorated — by the days of the month actually covered.
- **Give a lease's service fees an effective period** rather than only a present tense: each records when it began applying and, once given up, when it stopped. Removing a fee records the date instead of deleting the row, following how an occupant's departure is already recorded rather than erasing them.
- Charge a fee for the days its effective period overlaps the billed month. A fee taken up mid-month or given up mid-month is charged for the part of the month it applied, not all of it and not none of it.
- Let a fee be given up and taken again later, which the current design cannot express because a lease may hold each fee only once.
- **No change to rent, electricity, water, or how any of them is calculated.** An invoice's total changes only by the service fees now on it.

Deliberately out of scope:

- **Advance rent, invoice types, deposits, the revenue report.** All the billing change that follows.
- **Service fees on a final invoice.** There is no final invoice yet.
- **Repricing a fee across running leases.** A lease keeps the price it agreed; that decision stands and is unaffected here.

## Capabilities

### Modified Capabilities

- `service-fee`: a lease's fee records when it began and ended applying, may be given up and taken again, and reports the period it covers.
- `invoice`: service fees appear as line items, prorated for the days of the month they applied.

### New Capabilities

None.

## Impact

**Database.** Two columns on `LeaseServiceFee` — when the fee began applying and when it stopped — and the unique index becomes partial so a fee given up can be taken again. Existing rows backfill from the lease's start date, which is when they began applying in every case that exists.

**Code.** Invoice generation resolves which fees applied during the billed period and adds a line for each. Removing a fee writes a date instead of deleting.

**Behaviour that changes.** Invoices for leases that have service fees now carry those charges and cost more. Invoices for leases with none are byte-identical. That split is the verification: a lease with no fees must produce exactly the total it produced before.

**Existing invoices.** Untouched. Charges are recorded at issue time and this does not revisit them.

**Downstream.** The billing change puts these same lines on move-in and final invoices, and needs the effective period to answer "which fees applied during this period" for a month it is billing late.
