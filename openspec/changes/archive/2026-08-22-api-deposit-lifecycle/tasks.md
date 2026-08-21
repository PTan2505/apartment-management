# Tasks

## 1. Structure

- [x] 1.1 Add the deposit columns to `Lease`: what is held, what came from a predecessor, what left to a successor, what was returned and when, and why the return differed. Nullable or defaulting to zero, so no existing row changes meaning.
- [x] 1.2 Add `deposit_deduction` to `PaymentMethod`.
- [x] 1.3 Migrate. Confirm existing rows are untouched rather than assuming it. **Vacuous here**: the database holds no lease rows (verification data from the previous change was removed), so there was nothing to leave untouched. Every column defaults or is nullable, so the guarantee is structural; the defaults are checked as leases are created in section 7 instead.
- [x] 1.4 Run `prisma generate`.
- [x] 1.5 Report the deposit held and the difference against the lease's terms wherever a lease is returned. The difference is derived, never stored.

## 2. A deposit becomes held

- [x] 2.1 Move the holding when an invoice carrying a deposit line is marked paid, in the same transaction as the payment. The amount is what the line charged, not what the terms recompute.
- [x] 2.2 Remove the holding when such an invoice is voided. The charge it rested on no longer stands.
- [x] 2.3 Leave an invoice with no deposit line alone — no holding, no write.
- [x] 2.4 Backfill the holdings for deposits already charged and paid, as a script. State the expected total in advance — the sum of deposit lines on paid, non-voided move-in invoices — and check against it. **Ran against an empty database: 0 invoices, expected total 0, actual 0.** The script is re-runnable and skips holdings that have already moved on; its arithmetic is exercised for real by the section 7 verification, which creates paid deposits and re-runs it.

## 3. Settling from the deposit

- [x] 3.1 Accept `deposit_deduction` as a payment method, reducing the lease's holding by the invoice's total in the same transaction.
- [x] 3.2 Refuse a deduction exceeding what the lease holds, leaving the invoice pending. An owner cannot spend a deposit they do not have.
- [x] 3.3 Confirm a deducted invoice still counts as collected in the revenue report. The owner earned it and has it; only the route the money took differs.

## 4. Returning and adjusting

- [x] 4.1 Add recording a deposit return: the amount, the date, and a reason where it differs from what was held. Closes the holding.
- [x] 4.2 Report the settlement arithmetic — held, deducted, remaining — without proposing a figure to return. The owner decides.
- [x] 4.3 Refuse a return on a lease with no move-out, a return exceeding what is held, and a second return.
- [x] 4.4 Add recording a movement outside any invoice, in either direction, with a reason. Refuse one that would take the holding below zero.
- [x] 4.5 Confirm neither a return nor a movement appears as revenue or as an expense.

## 5. Extension

- [x] 5.1 Add extending a lease: close the predecessor at its expected end date and open the successor beginning that day, in one transaction.
- [x] 5.2 Close the predecessor exactly as a move-out does — occupancy records closed, final invoice issued — and **issue no overdue invoice**, stated explicitly rather than left to the dates coinciding.
- [x] 5.3 Carry the occupants, including which one is primary.
- [x] 5.4 Carry the kinds of service fee at the building's current prices, not the prices the predecessor was paying.
- [x] 5.5 Default the successor's rent from the room, its deposit months and occupant count from the predecessor, and its starting reading from the closing reading supplied. Accept overrides for each except the reading.
- [x] 5.6 Carry the deposit: out of the predecessor, into the successor, total unchanged.
- [x] 5.7 Charge the difference between the deposit required and the deposit carried on the successor's move-in invoice, as a signed deposit line. No line where the difference is zero.
- [x] 5.8 Allow the owner to decline settling on the invoice, leaving the difference reported as a shortfall or surplus.
- [x] 5.9 Normalise a late extension to the on-time case: predecessor closes on its agreed end date, successor begins there, no overdue invoice.
- [x] 5.10 Refuse extending a lease that has already recorded a move-out.
- [x] 5.11 Run `tsc --noEmit`.

## 6. Reporting what is held

- [x] 6.1 Add retrieving the deposits currently held, each with its lease, room and tenant, plus the total, filterable by building.
- [x] 6.2 Exclude returned and carried holdings. A deposit carried to a successor is counted against the successor alone.
- [x] 6.3 Keep this out of the revenue report. A holding is a balance at a moment; every figure there is a flow through a month.
- [x] 6.4 Require an authenticated owner on every new endpoint.

## 7. Verification against the running API

Failure paths included, not just the happy path. Every figure checked against an expectation stated in advance.

- [x] 7.1 A lease whose move-in invoice is unpaid reports a deposit held of zero.
- [x] 7.2 Paying that invoice makes the holding exactly what the deposit line charged.
- [x] 7.3 Voiding it removes the holding.
- [x] 7.4 A lease requiring 3,500,000 and holding 3,000,000 reports a shortfall of 500,000; one requiring 2,500,000 and holding 3,000,000 reports −500,000.
- [x] 7.5 **Extending a lease does not charge the deposit twice** — the successor's move-in invoice charges rent alone where the terms are unchanged. The case this change exists to prevent.
- [x] 7.6 **Total held is unchanged across an extension.** Sum before, sum after, same number.
- [x] 7.7 The two tenancies meet exactly: predecessor covers through the day before the successor's start.
- [x] 7.8 The successor carries the same occupants with the same primary, without them being supplied.
- [x] 7.9 A carried service fee is priced at the building's current amount, not the predecessor's.
- [x] 7.10 An extension raising the rent tops up on the invoice; paying it brings the holding to the full required amount and the shortfall to zero.
- [x] 7.11 An extension lowering the rent reduces what the move-in invoice owes, and the invoice total stays positive.
- [x] 7.12 **A negative deposit line produces no negative revenue** — the report skips it by kind, exactly as it skips a positive one.
- [x] 7.13 Declining to settle on the invoice leaves the difference reported and the invoice charging rent alone.
- [x] 7.14 **A late extension closes the predecessor on its agreed end date and issues no overdue invoice**, and the successor's first month bills the days that would otherwise have been overdue — checked for double-charging, not just for the absence of the invoice. **Result**: a lease running 2026-01-01 → 2026-04-01 extended on 2026-08-21 (four months late) charged Rent 2026-01, 2026-02 and 2026-03 on the predecessor — 9,000,000, exactly three months — and Rent 2026-04 on the successor. Every month once, no gap, no overlap, zero overdue invoices.
- [x] 7.15 A failure partway through an extension leaves the original tenancy active, unbilled, and without a successor. **Induced** by planting a non-voided `final` invoice on the lease so `issueFinalInvoice` violates the one-final-per-lease unique index mid-transaction. Result: HTTP 500, `moveOutDate` null, `endMeterReading` null, holding untouched at 3,000,000, one lease on the room, occupant still current. The 500 rather than a typed error is a raw uniqueness violation from a state unreachable through the API; left unhandled deliberately.
- [x] 7.16 Extending a finalized lease returns 409.
- [x] 7.17 Settling a final invoice by deduction pays it and reduces the holding by exactly its total.
- [x] 7.18 A deduction larger than the holding returns 400, leaves the invoice pending and the holding untouched.
- [x] 7.19 **`billed = collected + outstanding` still holds** across a range containing a deducted invoice.
- [x] 7.20 **Returning a deposit changes no figure in the revenue report** — take the report before and after and compare them field by field.
- [x] 7.21 A return on a running tenancy returns 409; a return above the holding returns 400; a second return returns 409.
- [x] 7.22 A movement in either direction moves the holding; one below zero returns 400.
- [x] 7.23 The deposits held list totals what the individual entries total, and a returned deposit is absent from both.
- [x] 7.24 A carried deposit appears once, against the successor.
- [x] 7.25 Every new endpoint returns 401 without a token and 403 with a non-owner one.
- [x] 7.26 Remove the verification data, leaving the database as it was found.
