## Context

See proposal.md — Why. What shapes the approach, all read from the code rather than assumed:

- Six files touch `paymentStatus`, `paymentMethod` or `paidAt`, and no spec mentions any of them by name — the specs describe behaviour. The blast radius is small.
- `paidAt` is written by exactly one place and read by none. The column exists and answers nothing.
- The revenue report buckets `collected` on `issueDate`, not on `paidAt`. Its name has never matched what it counts.
- `Invoice.totalAmount` is a stored figure with its reasoning written where it lives: the report sums it across many rows, and it is frozen in the same transaction as the lines that make it up. The precedent for a denormalised cache in this project.
- `deposits/service.ts` finds what a lease has spent by querying invoices where `paymentMethod = deposit_deduction`. That query has to move.
- Voiding a paid invoice currently succeeds. For a deposit deduction the holding is restored; for cash nothing happens at all.
- Payment is atomic — an invoice is paid in full or not — and every figure in the report leans on it.

## Goals / Non-Goals

**Goals:**

- Give a payment somewhere to exist before it has succeeded, which is what a gateway needs.
- Answer "how much money arrived this month", which nothing can answer today.
- Stop an owner voiding a bill they have been paid for.

**Non-Goals:**

- The gateway. No order codes, no webhook handling, no stored payloads.
- Partial payment. An invoice is still settled in full or not at all.
- A net cash figure. Expenses record when they were incurred, not when they were paid.
- Reconciling against an external source, which needs the gateway to reconcile with.

## Decisions

### `paymentStatus` stays on the invoice; `paymentMethod` and `paidAt` leave

The split looks arbitrary until you ask what each column means once a second payment exists.

`paymentMethod` and `paidAt` both become "which one?" — an invoice paid, reversed and paid again has two methods and two dates, and a column keeps only the last. They are facts about a payment and they move to the payment.

`paymentStatus` does not have that problem: an invoice is paid or it is not, however many payments it took to get there. And it is the one of the three that is queried — filtered directly (`?paymentStatus=pending`) and grouped over every invoice in a reported range. Deriving it means a join and an aggregate on every read of every invoice.

So it stays, as a cache written in the same transaction as the payment that changes it — the same trade `totalAmount` already makes, with the same guard against drift.

### Status now, gateway columns later

The payment record carries a status from the start. The gateway's columns — an order code, a reference, a raw payload — do not.

The asymmetry is about what retrofitting costs. Adding a nullable column later is a migration and nothing else. Adding a *status* later means deciding, for every row already written, what state it was in — and the answer has to be inferred from columns that were never meant to record it. The thing that is expensive to add late is added now; the things that are cheap are deferred.

The statuses this change actually uses are `succeeded` and `reversed`. The others a gateway needs (`pending`, `failed`, `cancelled`, `expired`) are not introduced here: an enum value nobody can reach is not a decision, it is a guess about what the gateway will need, and the gateway change is better placed to make it.

### Reversal is recorded, not deleted

A reversed payment keeps its row, gains a reversal date, and stops settling its invoice.

Deleting it was the alternative and loses the fact that the money moved at all. That matters for `received`: money that arrived in March and went back in April is two events in two months, and a deleted row reports neither.

It also means the invoice's status is "has a succeeded, unreversed payment", not "has any payment" — stated because it is easy to write the simpler query and be wrong only after a reversal.

### `collected` becomes `settled`, and it is renamed now

Nothing about the figure changes. Only the name.

`collected` beside a new `received` is the kind of pair that gets confused permanently — both read as "money in", and one of them is not. `settled` says what it does: of what was billed in this month, this much has been settled.

Renaming is cheap exactly once. No frontend consumes these fields yet; the four screens that will are not built. Left until they are, this becomes a rename across a UI as well as an API, and probably never happens.

### `received` goes in the revenue report, not in an endpoint of its own

The deposit change put "deposits held" in its own endpoint, on the grounds that a balance at a moment does not belong among figures that are flows through a month.

`received` is the opposite case and the same rule sends it the other way: it is a flow through a month, measured exactly like the others, and belongs beside them. Noted because the two decisions look inconsistent and are not.

### No net figure against `received`

`billed − expenses` and `settled − expenses` both compare accruals with accruals. `received − expenses` would compare cash in against costs *incurred*, which may not have been paid, and would read as a cash profit while being nothing of the kind.

Giving the expense side a payment date would fix it and is a change of its own. Until then `received` is reported alone.

### A deduction from a deposit counts as received when it is deducted

Awkward, and the alternatives are worse.

The cash genuinely arrived months earlier, when the tenant paid their deposit — but it was recorded as a holding, not as income, and deliberately excluded from every revenue figure. The month it is deducted is the month it stops being someone else's money and becomes the owner's.

Counting it back at the deposit's own date would mean revising a month already reported; not counting it at all would mean revenue that is settled but never received.

## Risks / Trade-offs

- **`billed = settled + outstanding` must survive the move.** It is the identity every other figure leans on. → Checked directly, before and after, with paid, unpaid, reversed and deposit-settled invoices in range.

- **The backfill is the whole of the existing history.** Every paid invoice needs a payment record, and a mistake makes `settled` and `received` disagree with reality from the start. → Its own task with the count and total stated in advance, checked against the invoices it was built from, and re-runnable.

- **Two sources of truth for whether an invoice is paid.** The cached status and the payment rows can disagree. → Every write happens in one transaction, as with `totalAmount` and `depositHeld`; and the verification checks the two agree across the whole database rather than on the row it just wrote.

- **Refusing to void a paid invoice could strand an owner.** → Which is why reversal ships in the same change rather than after it. Verified as a sequence: reverse, void, reissue.

- **`received` will not match a bank statement.** A deposit deduction is counted in it, and no money moved that month. → Named in the spec rather than discovered later. The method is on the payment, so a stricter cash figure remains derivable when something needs one.

- **Renaming a field in a report several changes have leaned on.** → No consumer exists, and the rename is mechanical. The risk is a stale reference in a spec or a script rather than in behaviour, which the strict validation and a repository-wide search both catch.

## Migration Plan

1. Add the payment table and its status enum. Nothing reads it yet.
2. Backfill a succeeded payment for every paid, non-voided invoice, from the columns about to be removed. Verify against the count and total stated in advance.
3. Switch reads over — the report, the deposit deduction lookup — and check every figure is unchanged.
4. Drop `paymentMethod` and `paidAt` from `Invoice`, once nothing reads them.
5. Rollback before step 4 is dropping the table; after step 4 it needs the backfill run in reverse, which is why the drop is last and separate.
