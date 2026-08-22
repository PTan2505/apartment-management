## Why

Paying an invoice is three columns on it: a status, a method, and a date. That is enough while the only way to pay is an owner ticking a box — an act that cannot fail, cannot be pending, and happens once.

A payment gateway breaks all three assumptions at once. A tenant scanning a QR code produces a payment that **exists before it succeeds**, and may then succeed, be abandoned, expire, or be reported twice because the gateway retried its webhook. None of that fits in `pending | paid`, and there is nowhere to record the gateway's order code so a webhook arriving later can be matched to the invoice it belongs to.

Two things surfaced while reading the code for this:

- **`paidAt` is written and never read.** Nothing in the system asks when money actually arrived.
- **`collected` does not mean what its name says.** It is bucketed by the month an invoice was *issued*, so an invoice issued in March and paid in May counts toward March. That is a useful figure — how much of March's billing has come in — but it is not "how much money did I receive in March", which is the question an owner asks more often and which this system cannot currently answer.

## What Changes

**A payment becomes its own record**

- **Add a payment record**, one per attempt, carrying its own amount, method, date and **status**. An invoice may have more than one over its life: a payment reversed and taken again is two events, not one overwritten.
- Move `paymentMethod` and `paidAt` off the invoice. Both ask "which one?" the moment a second payment exists.
- **Keep `paymentStatus` on the invoice**, as a cache written in the same transaction as the payment that changes it. It is filtered on and grouped over every invoice in a range, and deriving it would mean a join on every read. Same trade, and same reasoning, as the stored invoice total.

**Undoing a payment becomes possible, and voiding a paid invoice becomes impossible**

- **Add reversing a payment**: the owner hands the money back, the invoice returns to pending, and a deposit deduction returns to the holding it came from.
- **BREAKING**: voiding an invoice that has been paid is refused. Today it succeeds, the invoice leaves every total, and the cash stays in the owner's pocket with nothing recording that they hold money for a bill that no longer exists.
- The two go together. Closing the void route without opening the reversal route would leave an owner who mistyped an invoice unable to correct it.

**The report answers a question it could not**

- **BREAKING**: `collected` is renamed **`settled`** and `netCollected` to **`netSettled`**. Neither figure changes; the names now say what they mean — of what was billed in this month, this much has been settled.
- **Add `received`**: money that actually arrived during the month, taken from the dates on the payments themselves. The first genuine cash figure in the system.
- Renaming now rather than later is deliberate. Nothing consumes these fields yet, and `collected` sitting beside `received` would mislead every reader from here on.

## Capabilities

### New Capabilities

- `payment`: what settles an invoice — its amount, method, date and status — recorded as an event in its own right, reversible, and summable into what an owner actually received.

### Modified Capabilities

- `invoice`: recording payment writes a payment record; a paid invoice cannot be voided.
- `revenue-report`: `collected` becomes `settled`; a new `received` reports money that arrived in the month.
- `deposit`: a deduction is a payment, and reversing one returns the holding.

## Impact

**Database.** A new table. Two columns leave `Invoice`. No figure changes.

**Code.** Marking paid and voiding both gain a payment write. The report reads payments as well as invoices.

**Behaviour that changes.**

- `POST /invoices/:id/void` returns 409 for a paid invoice where it used to succeed.
- The revenue report's `collected` and `netCollected` fields are renamed.

Neither breaks anything today: no frontend exists, and both endpoints have only ever been called by this project's own verification runs.

**Existing data.** Every paid invoice gets a payment record backfilled from the columns being removed. Stated as its own task with the figure expected in advance, not assumed.

**Out of scope.** The gateway itself, and the columns it needs — an order code, a gateway reference, a stored webhook payload. Those are nullable additions that cost nothing to add later. The **status** is included now precisely because it is the one thing that cannot be retrofitted cheaply: adding it afterwards means deciding what state every existing row was in.

Also out of scope: partial payment, which stays impossible; and a net cash figure, because expenses record when they were *incurred* and not when they were paid, so `received` less expenses would be half cash and half accrual. `received` is reported on its own until the expense side can answer the same question.

**Downstream.** The tenant portal creates payments through this and settles them from a webhook.
