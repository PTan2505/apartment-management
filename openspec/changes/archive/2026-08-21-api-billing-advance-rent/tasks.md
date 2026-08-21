# Tasks

## 1. Structure

- [x] 1.1 Make `year`, `month`, `periodStart`, `periodEnd`, `previousElectricityUse` and `currentElectricityUse` optional on `Invoice`. All six are true of a monthly bill and false of a move-in one.
- [x] 1.2 Add a period to `InvoiceLineItem`, nullable — a deposit is not charged for a span of time.
- [x] 1.3 Add a deposit line kind.
- [x] 1.4 Migrate. Existing rows are untouched: every one is a monthly invoice carrying everything it always did. Confirm that rather than assuming it.
- [x] 1.5 Run `prisma generate`.
- [x] 1.6 Set each line's period at generation: utilities lines get the billed month, the rent line gets the month it is charged for, a deposit line gets none.

## 2. Rent a month in advance

- [x] 2.1 Resolve the rent period separately from the utilities period — the part of the *following* month the lease covers.
- [x] 2.2 Prorate rent by that period, not by the utilities one. Prorating rent by the utilities month reduces February's rent for days January was empty, which is wrong and looks plausible.
- [x] 2.3 Refuse a monthly invoice whose following month falls outside the term. Refuse rather than omit the rent line — an invoice with no rent is what a final invoice looks like.
- [x] 2.4 Leave water and service fee proration alone; they keep the period they have.

## 3. The move-in invoice

- [x] 3.1 Issue it inside the transaction that creates the lease, alongside the primary occupant. A failure must roll back all three.
- [x] 3.2 Charge rent from the start date to the end of that calendar month, prorated where the tenancy begins partway through.
- [x] 3.3 Charge the deposit at the lease's agreed amount, as a deposit line with no period.
- [x] 3.4 Omit the deposit line entirely for a lease agreed with no deposit — not a line of zero.
- [x] 3.5 Record no month, no period and no meter readings on it.
- [x] 3.6 Guard one move-in invoice per lease.

## 4. The final and overdue invoices

- [x] 4.1 Issue the final invoice inside the transaction that records the move-out, alongside the occupant departures.
- [x] 4.2 Charge utilities to the last day covered and **no rent** — that month's rent was charged a month earlier.
- [x] 4.3 Compute its electricity from the handover reading against where the lease's billing had reached.
- [x] 4.4 Where the departure falls after the term, issue an overdue invoice too, covering the days beyond it.
- [x] 4.5 Accept the overdue charges on the move-out request: each names a building service fee and an amount.
- [x] 4.6 Reject a charge naming a fee from another building, and issue neither invoice.
- [x] 4.7 Allow an overdue invoice with no charges, for an owner waiving the days.
- [x] 4.8 Guard one final and one overdue invoice per lease.
- [x] 4.9 Run `tsc --noEmit`.

## 5. Revenue

- [x] 5.0 Attribute every invoice to the month it was **issued**, not the month it covers. Brought forward from the deposit-lifecycle change: a move-in invoice covers no month at all, so grouping by the covered month leaves it unplaceable the moment one exists. Reported figures shift as a result — that is the point of doing it here rather than landing a broken report.
- [x] 5.1 Build billed, collected and outstanding from an invoice's charges rather than its total, skipping deposit lines.
- [x] 5.2 Keep `totalAmount` as what the tenant owes. It is a different question from what the owner earned, and both are real.
- [x] 5.3 Confirm `billed` still equals `collected` plus `outstanding` with deposits excluded from all three.

## 6. Verification against the running API

Failure paths included, not just the happy path. Every figure checked against an expectation stated in advance, since no "nothing moved" check is available for this change.

- [x] 6.1 Creating a lease beginning on the 1st issues a move-in invoice charging a full month's rent and the deposit, and nothing else.
- [x] 6.2 **Creating a lease beginning on the 15th of a 31-day month charges 17 days of rent** — check the arithmetic. **Result**: 1,645,161 = 3,000,000 × 17/31, exact.
- [x] 6.3 A lease with a zero-month deposit gets a move-in invoice with a rent line and no deposit line.
- [x] 6.4 The move-in invoice reports no month, no period and no meter readings.
- [x] 6.5 A failure creating the lease leaves no lease, no occupant and no invoice.
- [x] 6.6 **A monthly invoice for January charges January's utilities and February's rent**, and each line reports its own period.
- [x] 6.7 **A lease beginning 15 January is charged a FULL February rent on its January invoice** — the case where prorating rent by the utilities month gives a plausible wrong answer. **Result**: rent 3,000,000 for period 2026-02-01…2026-02-28, while the utilities lines carry 2026-01-15…2026-01-31.
- [x] 6.8 A monthly invoice whose following month is only partly covered by the term prorates the rent against that month.
- [x] 6.9 A monthly invoice whose following month is beyond the term returns 400.
- [x] 6.10 Recording a move-out issues a final invoice with utilities and no rent line.
- [x] 6.11 The final invoice's utilities cover to the day before the move-out date.
- [x] 6.12 A late move-out issues both a final and an overdue invoice; an on-time one issues only a final.
- [x] 6.13 The overdue invoice carries exactly the charges named, at the amounts given, including an amount different from the fee's current one.
- [x] 6.14 A late move-out with no charges named issues an overdue invoice carrying none.
- [x] 6.15 An overdue charge naming another building's fee returns 400 and issues neither invoice.
- [x] 6.16 A second move-out on the same lease is still refused, and no second final invoice appears.
- [x] 6.17 **Sum the rent charged across a whole tenancy and confirm it equals the months agreed** — the end-to-end check that advance billing neither double-charges nor drops a month. **Result**: a 3-month lease charged 3,000,000 on the move-in (Jan), 3,000,000 on the January invoice (for Feb) and 3,000,000 on the February invoice (for Mar) — 9,000,000 for 3 months, with the final invoice carrying no rent.
- [x] 6.17a A move-in invoice appears in the report under the month it was issued.
- [x] 6.17b An invoice covering an earlier month but issued later counts toward the issue month.
- [x] 6.18 A deposit is excluded from `billed`; paying that invoice increases `collected` by the rent alone.
- [x] 6.19 `billed` still equals `collected` plus `outstanding` across a range containing move-in, monthly and final invoices.
- [x] 6.20 An invoice's `totalAmount` still reports what the tenant owes, including the deposit.
- [x] 6.21 The electricity chain runs unbroken from the first monthly invoice through the final one. **Caught a real bug**: `resolveOpeningReading` ordered by `year desc`, and NULL sorts first under DESC in Postgres — so the move-in invoice (null year, null reading) won that query and every invoice after the first opened from the lease's starting reading. Fixed by excluding invoices with no reading, in all three places that resolve one.
- [x] 6.22 Remove the verification data, leaving the database as it was found.
