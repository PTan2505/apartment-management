# Tasks

## 1. Capture the "before" picture

Everything this change touches must come out the same on the other side. Capture that first, while it is still true.

- [x] 1.1 Build a database with paid, unpaid, deposit-settled and voided invoices across several months and buildings, plus leases holding deposits.
- [x] 1.2 Save the full revenue report over a range covering all of it, and the full deposits-held response. These are the reference for every "nothing moved" check that follows.

## 2. The payment record

- [x] 2.1 Add a payment record against an invoice: amount, method, the date the money moved, and a status.
- [x] 2.2 Give it only the statuses this change reaches — succeeded and reversed. The ones a gateway needs are that change's decision, not a guess made here.
- [x] 2.3 Record a reversal as a date on the payment rather than by deleting it. Money that arrived and went back is two facts in two months.
- [x] 2.4 Keep `paymentStatus` on the invoice as a cache, written in the same transaction as the payment that changes it.
- [x] 2.5 Migrate. The table is additive and nothing reads it yet.
- [x] 2.6 Run `prisma generate`.

## 3. Backfill

- [x] 3.1 Write a succeeded payment for every paid, non-voided invoice, from the method and date on the invoice itself.
- [x] 3.2 State the count and total expected in advance and check against them, rather than reading the result and calling it right.
- [x] 3.3 Make it re-runnable: an invoice that already has a payment is left alone.
- [x] 3.4 Confirm every paid invoice has exactly one payment, and no unpaid invoice has any.

## 4. Paying, reversing, voiding

- [x] 4.1 Write the payment, the invoice's status, and any deposit movement in one transaction when an invoice is marked paid.
- [x] 4.2 Refuse a deduction beyond the deposit held, writing no payment.
- [x] 4.3 Add reversing a payment: the invoice returns to pending and a deposit deduction returns to its holding.
- [x] 4.4 Refuse reversing a payment that is already reversed.
- [x] 4.5 **Refuse voiding a paid invoice.** It removes the bill from every total while the money stays put.
- [x] 4.6 Keep voiding an unpaid invoice working, and reissuing after it.
- [x] 4.7 Remove the old void-time deposit restoration. It belongs to reversal now, and leaving both would restore a holding twice.
- [x] 4.8 Move the deposit's "what has been deducted" lookup off the invoice columns and onto payments.
- [x] 4.9 Run `tsc --noEmit`.

## 5. The report

- [x] 5.1 Rename `collected` to `settled` and `netCollected` to `netSettled`. Neither figure changes.
- [x] 5.2 Search the whole repository for the old names, including specs and scripts, so nothing is left referring to a field that no longer exists. The remaining hits are prose about deposits "collected in cash", not the field.
- [x] 5.3 Add `received`: money that arrived in the month, keyed on the payment's own date.
- [x] 5.4 Exclude deposits from it, on the same grounds as everywhere else.
- [x] 5.5 Subtract a reversal from the month it was reversed, leaving the original month reporting what it received.
- [x] 5.6 Report no net figure against `received`, because expenses record when they were incurred rather than paid.

## 6. Dropping what moved

- [x] 6.1 Confirm nothing reads `Invoice.paymentMethod` or `Invoice.paidAt` any more.
- [x] 6.2 Drop both columns, in a migration of their own so the rollback before it is just dropping a table. The backfill script was removed with them — it reads columns that no longer exist, so it can neither compile nor run again; its result is recorded in the migration's comment.

## 7. Verification against the running API

Failure paths included, not just the happy path. Every figure checked against an expectation stated in advance.

- [x] 7.1 **Nothing moved**: the revenue report over the reference range is identical to the "before" capture, field by field, apart from the renamed fields and the new one.
- [x] 7.2 **Nothing moved**: the deposits-held response is identical to the "before" capture.
- [x] 7.3 **`billed = settled + outstanding`** still holds, with paid, unpaid, reversed and deposit-settled invoices in range.
- [x] 7.4 Marking an invoice paid writes one payment with the method and date given, and the invoice reports itself paid.
- [x] 7.5 Marking an already paid invoice paid returns 409 and leaves one payment.
- [x] 7.6 A deduction beyond the holding returns 400, writes no payment, and leaves the holding untouched.
- [x] 7.7 **Reversing a cash payment** returns the invoice to pending and leaves the payment recorded with both dates.
- [x] 7.8 **Reversing a deposit deduction restores the holding** by exactly the invoice's total.
- [x] 7.9 Reversing an already reversed payment returns 409 and changes nothing.
- [x] 7.10 **Voiding a paid invoice returns 409.**
- [x] 7.11 **Reverse, void, reissue works as a sequence** — the recovery path that refusing the void depends on existing.
- [x] 7.12 Voiding an unpaid invoice still works, and a replacement can still be issued for that lease and month.
- [x] 7.13 **Voiding a paid deposit-settled invoice no longer restores the holding twice** — it cannot be voided at all until the payment is reversed, and the reversal restores it once.
- [x] 7.14 **An invoice issued in March and paid in May**: `settled` counts it in March, `received` counts it in May. The whole point of the change, checked directly. **Result**: invoices issued 2026-02-05 and paid 2026-05-11 and 2026-05-28 appear under February's `settled` (10,125,000) and May's `received` (6,750,000). Totals agree — `settled` 22,875,000 = `received` 22,875,000 — the same money reported in different months.
- [x] 7.15 A month whose invoices are all unpaid reports `received` of zero and a non-zero `billed`.
- [x] 7.16 A month containing only payments of earlier invoices reports `billed` of zero and a non-zero `received`.
- [x] 7.17 Paying a move-in invoice increases `received` by the rent alone, not by the deposit.
- [x] 7.18 **A payment taken in March and reversed in April**: March still reports it received, April reports the same amount subtracted. **Result**: taken 2026-06-15, reversed 2026-07-02 — June `received` 3,340,000, July `received` −3,340,000, summing to zero. First attempt measured nothing because the test had voided the invoice, which removes it from every figure; re-run on an invoice left standing.
- [x] 7.19 A deposit deduction made in May counts toward May's `received`.
- [x] 7.20 The report carries no net figure against `received`.
- [x] 7.21 Filtering invoices by payment status still returns what it did.
- [x] 7.22 **The cache agrees with the payments across the whole database**: every invoice reporting itself paid has a succeeded unreversed payment, and every one reporting pending has none.
- [x] 7.23 Every new endpoint returns 401 without a token and 403 with a non-owner one.
- [x] 7.24 Remove the verification data, leaving the database as it was found.
