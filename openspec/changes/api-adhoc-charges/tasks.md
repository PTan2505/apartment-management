# Tasks

## 1. Structure

- [x] 1.1 Add an ad-hoc invoice kind and a charge line kind.
- [x] 1.2 Add a nullable charge category to `InvoiceLineItem`, from a fixed set mirroring the expense categories. It lives on the line, not the invoice: one bill may carry a damage charge and a cleaning charge.
- [x] 1.3 Add **no** unique index for the ad-hoc kind. A lease may have as many as it has events, and the three one-per-lease indexes exist for rules that are not this one.
- [x] 1.4 Migrate. Confirm existing rows are untouched rather than assuming it. Purely additive — two `ALTER TYPE ... ADD VALUE`, one new enum type, one nullable column — so no existing row can change meaning.
- [x] 1.5 Run `prisma generate`.
- [x] 1.6 Report the category on every line that has one.

## 2. Issuing an ad-hoc invoice

- [x] 2.1 Add issuing an ad-hoc invoice for a lease, carrying charges the owner names, categorises and prices.
- [x] 2.2 Record no month, no period and no meter readings on it, and no period on its lines. A charge for an event has no span to report.
- [x] 2.3 Set its total to the sum of its charges, written in the same transaction as them.
- [x] 2.4 Refuse an invoice with no charges, an unrecognised category, and a negative amount.
- [x] 2.5 Allow it against a finalized lease. Damage is usually found after the tenant has gone.
- [x] 2.6 Decide the kind from the operation, never from the caller — as every other kind already is.
- [x] 2.7 Run `tsc --noEmit`.

## 3. Revenue

- [x] 3.1 Count a charge line as revenue. Confirm rather than assume: the report excludes `deposit` by kind, so a new kind is included by default — check it, because "it should already work" is how a wrong figure ships.
- [x] 3.2 Report charges broken down by category, per building and across the selection, mirroring the expense breakdown.
- [x] 3.3 Report a category with nothing charged as zero rather than omitting it.
- [x] 3.4 Keep the breakdown a partition of `billed`, adding nothing to it.

## 4. Returning a deposit returns all of it

- [x] 4.1 **BREAKING**: remove the amount from the deposit return. The holding is what goes back.
- [x] 4.2 Remove the free-text reason with it. A reason for keeping money now lives on the charge that took it, where it has a category and an amount.
- [x] 4.3 Read out and report any reasons already recorded before dropping the column, so nothing is lost silently. **Ran before the drop: none recorded.** The reporting script was removed afterwards — it reads a column that no longer exists, so it cannot compile or run again; its result is recorded in the migration's own comment.
- [x] 4.4 Allow a return of zero, for a tenancy whose deposit was entirely spent on what it owed. That is a different fact from a deposit nobody has dealt with.
- [x] 4.5 Keep refusing a return on a running tenancy, and a second return.
- [x] 4.6 Drop the note column.

## 5. Verification against the running API

Failure paths included, not just the happy path. Every figure checked against an expectation stated in advance.

- [x] 5.1 An ad-hoc invoice charging 200,000 for damage is created, reports that charge with its category, and totals 200,000.
- [x] 5.2 One invoice carrying a damage charge and a cleaning charge totals both.
- [x] 5.3 A lease accepts a second ad-hoc invoice; both exist with their own issue dates.
- [x] 5.4 An ad-hoc invoice reports no month, no period, no readings, and its lines report no period.
- [x] 5.5 An ad-hoc invoice is accepted against a finalized lease.
- [x] 5.6 No charges returns 400; an unknown category returns 400; a negative amount returns 400. Nothing is created in any case.
- [x] 5.7 A lease id that does not exist returns 404.
- [x] 5.8 **A charge is counted as revenue** — `billed` for the issue month increases by exactly the amount charged. **Result**: billed 3,700,000 = 3,000,000 move-in rent + 200,000 + 500,000 of charges, exactly as stated in advance.
- [x] 5.9 **`billed = collected + outstanding` holds** across a range containing an ad-hoc invoice, both while unpaid and after payment.
- [x] 5.10 Settling an ad-hoc invoice by deduction reduces the holding by exactly its total, and it counts as collected.
- [x] 5.11 A deduction larger than the holding returns 400 and leaves both the invoice and the holding untouched.
- [x] 5.12 The category breakdown sums to the ad-hoc portion of `billed` and does not exceed `billed`.
- [x] 5.13 A category with nothing charged reports zero.
- [x] 5.14 **The end-to-end case this change was proposed for**: a 3,000,000 deposit, a 200,000 damage charge settled from it, a 180,000 repair expense, and a return. Expect 2,800,000 returned, holding zero, revenue up 200,000, expenses up 180,000, and net up 20,000 — the owner made 20,000 on the window, and the report says so. **Result**: every figure exactly as predicted — refunded 2,800,000, holding 0, billed +200,000, collected +200,000, expenses +180,000, both net figures +20,000.
- [x] 5.15 A return supplying an amount ignores it and returns the whole holding.
- [x] 5.16 A return for a lease holding nothing records zero and reports the deposit settled.
- [x] 5.17 A return on a running tenancy returns 409; a second return returns 409.
- [x] 5.18 **Returning a deposit still changes no figure in the revenue report** — take the report before and after and compare field by field, as the previous change did.
- [x] 5.19 Every new endpoint returns 401 without a token and 403 with a non-owner one.
- [x] 5.20 **Nothing that was already correct moved**: an invoice of every other kind still reports the same charges and totals, and a range containing no ad-hoc invoice reports exactly what it reported before.
- [x] 5.21 Remove the verification data, leaving the database as it was found.
