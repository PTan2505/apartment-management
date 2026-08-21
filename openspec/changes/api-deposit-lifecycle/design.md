## Context

See proposal.md — Why. What shapes the approach, all checked rather than assumed:

- A lease's deposit exists only as `depositMonths`, with the amount derived as `depositMonths × baseRent`. Nothing records currency, and nothing records whether any of it arrived.
- The deposit is charged as a `deposit` line on the move-in invoice, and the revenue report already skips that line kind — by kind, not by sign.
- `Invoice.totalAmount` is the sum of its lines, written in the same transaction as them and never updated afterwards. The project's one precedent for storing a derivable figure, and its reasoning is stated where it lives.
- Creating a lease is already a transaction (lease, primary occupant, move-in invoice). Recording a move-out is already a transaction (lease, occupant departures, final invoice, overdue invoice where late).
- `recordMoveOut` issues an overdue invoice whenever `moveOutDate > expectedEndDate`. An extension must close a lease at exactly that date without that branch firing.
- `PaymentMethod` is `cash | bank_transfer`, and marking an invoice paid is a single field update with no side effects.
- The revenue report reads invoices and expenses. It reads nothing else, which is what makes "this change did not move a revenue figure" checkable.

## Goals / Non-Goals

**Goals:**

- Make the money an owner holds on someone else's behalf a fact the system knows, in currency, per lease.
- Let a renewal keep a deposit rather than return and recharge it.
- Let a departure settle an unpaid bill from the deposit, and return the rest.

**Non-Goals:**

- A general ledger of money movements. The payment-records change that follows introduces one for invoice payments; whether deposit movements eventually join it is that change's question, not this one's.
- Partial payment of an invoice. Deduction settles a whole invoice, as cash does.
- Any tenant-facing view of a deposit.
- Interest, or any figure that accrues over time.

## Decisions

### The holding is stored, not derived

`depositHeld` is a column on `Lease`, written by each operation that moves money.

Deriving it was the first instinct and does not survive contact with the requirements. It would have to be `deposit lines on the paid move-in invoice`, which is blind to exactly the two cases this change exists for: a deposit carried from a predecessor was never charged on the successor's invoice, and a top-up collected in cash was never charged at all. A derivation that misses half its inputs is worse than a stored value, because it looks authoritative.

The stored value can drift, and the mitigation is structural rather than procedural: every write happens inside the transaction of the operation that moved the money — paying an invoice, extending, adjusting, returning. This is the same argument `Invoice.totalAmount` already makes, and this project has one precedent for it rather than none.

What stays derived is the **difference**: `depositMonths × baseRent − depositHeld`. It is a comparison between two facts, not a fact.

### Deposit state lives on `Lease`, not in a movements table

Five columns: what is held, what came from a predecessor, what left to a successor, what was returned and when, and why the return differed.

A `DepositMovement` ledger was the alternative and is the better long-term shape — it itemises deductions, it makes a carry-over two rows rather than two columns on two tables, and it never needs a stored balance. It was rejected for this change because the balance is the question actually being asked, every requirement here is answered by it, and a second parallel money table landing in the same change as the first deposit refund is more moving parts than the problem has.

The cost is named rather than hidden: a lease's deposit history is not reconstructible from these columns. If a deduction, a top-up and a return all happen, the columns show the outcome, not the sequence.

### Extension composes the existing paths, and differs from a move-out in exactly one way

Extending is: close the predecessor at its expected end date, create the successor, carry the deposit — one transaction.

Closing reuses everything a move-out does, with a single deliberate exception: **no overdue invoice**. `recordMoveOut` issues one when the departure falls after the term. An extension always closes *on* the term's end date, so the branch would not fire on its own — but that is a coincidence of the date, not a decision, so the extension states it rather than relying on it.

The successor's creation reuses lease creation, including its move-in invoice, so advance rent and proration need no second implementation.

### A late extension is backdated, and a late move-out is not

These are opposite rules, deliberately.

A move-out records the day the tenant actually left, even when that is past the agreed end date, and those days get an overdue invoice priced by the owner. An extension records the agreed end date, whenever the owner gets round to entering it, and issues nothing for the gap.

The difference is not administrative convenience. Overdue days are days *nobody agreed to* — the tenancy ran on because neither party renewed, so no rent applies and the owner has to decide what they cost. When the parties do renew, those same days were covered all along by the agreement being signed; they are the successor's first days and its first month's rent already pays for them. Treating them as overdue would charge for days that the new lease also charges for.

The visible consequence: an owner who extends a month late finds the successor already a month old, with a month of billing owed. That is correct — the tenancy was a month old — and the monthly invoices for it can be generated as normal.

### Settling the deposit difference on an invoice uses a signed deposit line

At an extension, the successor's move-in invoice carries a deposit line of `required − carriedIn`: positive to top up, negative to hand back, absent when zero.

A negative amount is the first in this system, so its consequences were checked rather than assumed. `totalAmount` stays the sum of the lines and stays positive in any ordinary case, because the first month's rent is on the same invoice and exceeds a plausible surplus. The revenue report skips deposit lines **by kind**, so a negative one produces no negative revenue — it is skipped exactly as a positive one is.

The alternative, a separate credit line kind, was rejected: a deposit top-up and a deposit refund are the same fact with opposite signs, and giving them different kinds would mean the report has to know about both to keep skipping them.

### The owner decides the return; the system does the arithmetic

Returning a deposit reports what is held and what has been deducted, and asks for a figure. It does not propose one.

This follows the overdue invoice's precedent for the same reason: the deduction for a damaged room is a fact the system cannot hold. Proposing `held − deducted` would be right most of the time and silently wrong whenever there is damage — and an owner who accepts a proposed figure by reflex is worse off than one who was asked.

### The revenue report is not touched

Nothing in this change edits the report. Deposits were already excluded by kind; a return is neither revenue nor expense and is written nowhere the report reads; a deduction reaches it only as an invoice becoming paid, which it already handles.

Stated as a decision because it is this change's cheapest verification: the revenue figures for a range must be identical before and after a deposit is returned, and that is checkable directly rather than by reading code.

## Risks / Trade-offs

- **A stored balance can disagree with the events that produced it.** → Every write is inside the transaction that moved the money, so a partial update is impossible; and the backfill is a one-off with a stated expected result rather than a heuristic. The residual risk is a future code path that moves money and forgets — which is why the number of such paths is deliberately four and named.

- **Extension is the most compound operation in the system**: it closes a lease, issues a final invoice, creates a lease with its occupants and fees, and issues a move-in invoice. → One transaction, and a verification that a failure at each stage leaves the original tenancy running and unbilled. A half-applied extension would leave a room with no active lease and someone living in it.

- **`deposit_deduction` puts money in `collected` that did not arrive this month.** The revenue report is right — the owner earned it and holds it — but a future cash-flow report must exclude it. → The method is recorded on the invoice, so the distinction stays available. Named here so the next report that needs it does not have to rediscover it.

- **Backfilling existing holdings.** Deposits already charged and paid must become held, or the first `GET /deposits` under-reports. → A task of its own with a figure stated in advance: the sum of deposit lines on paid, non-voided move-in invoices. Verified against that sum rather than eyeballed.

- **A negative line item is new.** → Checked against the two invariants that could break: `totalAmount` as the sum of lines, and the revenue report's exclusion by kind. Both hold, and both are verified rather than reasoned about.

- **The deposit history is not reconstructible.** A lease that was deducted from, topped up and returned shows three columns and no sequence. → Accepted for this change; the return carries a free-text reason, which is where an owner would look. If the history becomes a question people ask, that is the signal to move to a movements table.

## Migration Plan

1. Add the columns to `Lease`, nullable or defaulting to zero. No existing row changes meaning.
2. Add `deposit_deduction` to `PaymentMethod` via `ALTER TYPE ... ADD VALUE`, as the invoice kinds were added.
3. Backfill `depositHeld` from paid, non-voided move-in invoices, as a script rather than a migration — it reads invoice lines, and a data question belongs where it can be re-run and checked.
4. Rollback is dropping the columns; nothing outside this change reads them, and no existing behaviour depends on them.
