# Tasks

## 1. Capture the "before" figures

Done first, because after the migration there is nothing left to compare against.

- [x] 1.1 Count existing invoices and record it.
- [x] 1.2 Generate a set of invoices covering the cases that matter — a full month, a month the lease started partway through, a month it ended partway through — and record every resulting total, charge, rate, and count. This is the baseline the change is measured against, so it is captured before anything is touched.

## 2. Schema and migration

- [x] 2.1 Add `InvoiceLineItem` to `schema.prisma`: invoice, kind, description, nullable quantity, nullable unit amount, amount, and a sort position so ordering is stable.
- [x] 2.2 Write the migration in strict order — create the table, convert existing invoices into lines, and only then drop the columns. Dropping first would discard the data the conversion reads.
- [x] 2.3 Convert each existing invoice into three lines from `rentAmount`, `electricityAmount`, and `waterAmount`, carrying `baseRent`, `electricityRate`, `waterRatePerPerson`, and `occupantCount` onto the line each belongs to.
- [x] 2.4 Drop `rentAmount`, `electricityAmount`, `waterAmount`, `baseRent`, `electricityRate`, `waterRatePerPerson`, and `occupantCount` from `Invoice`.
- [x] 2.5 Confirm `year`, `month`, `periodStart`, `periodEnd`, `previousElectricityUse`, `currentElectricityUse`, `totalAmount`, and the payment fields all remain. The meter chain and the revenue report depend on two of these.
- [x] 2.6 Apply the migration and run `prisma generate`.

## 3. Generation

- [x] 3.1 Write line items instead of charge columns, in the same transaction as the invoice, so a total never exists without the lines that account for it.
- [x] 3.2 Do not modify `computeCharges`. It produces the same figures; only their destination changes.
- [x] 3.3 Put each rate and count on the line it produced: consumption and rate on electricity, occupant count and per-person rate on water, the lease's agreed rent as the rent line's unit amount with no quantity.
- [x] 3.4 Give lines a stable order, and keep `totalAmount` as their sum.
- [x] 3.5 Report line items wherever an invoice is returned. Check every return site rather than assuming one mapper covers them.
- [x] 3.6 Run `tsc --noEmit`.

## 4. Confirm the consumers were not touched

- [x] 4.1 Confirm `modules/reports/` has no edit in this change. It reads only `totalAmount`; needing to change it means something moved that should not have.
- [x] 4.2 Confirm the electricity chain in `modules/invoices/` and the move-out check in `modules/leases/` have no edit. Both read only `currentElectricityUse`.

## 5. Verification against the running API

- [x] 5.1 Regenerate the same invoices as task 1.2, from the same inputs, and compare every total against the recorded baseline. **Equal to the currency unit, not merely plausible.** This is the check the whole change rests on.
- [x] 5.2 Compare each individual charge against its baseline too, not only the totals — three wrong charges can sum to a right total.
- [x] 5.3 Confirm each invoice's total equals the sum of its line items.
- [x] 5.4 A full-month invoice's electricity line reports units and rate, and their product equals its amount.
- [x] 5.5 A full-month invoice's water line reports occupant count and per-person rate, and their product equals its amount.
- [x] 5.6 A partial-month invoice's rent line reports the full monthly rent as its unit amount, and its amount is that reduced by the days occupied — the case where quantity times unit amount deliberately does not equal the amount.
- [x] 5.7 The rent line carries no quantity.
- [x] 5.8 Retrieving the same invoice twice returns its lines in the same order.
- [x] 5.9 Changing a building's rate afterwards leaves the issued invoice's electricity line reporting the old rate.
- [x] 5.10 Changing a lease's occupant count afterwards leaves the issued invoice's water line reporting the old count.
- [x] 5.11 Run a revenue report and confirm its figures match what the same data produced before the change.
- [x] 5.12 Generate a second invoice for the lease and confirm its opening reading still came from the previous invoice's closing reading — the chain is intact.
- [x] 5.13 Confirm move-out still rejects a closing reading below the last invoiced one.
- [x] 5.14 Confirm the response no longer carries `rentAmount`, `electricityAmount`, or `waterAmount` as invoice fields, so nothing reads a stale duplicate.
- [x] 5.15 Exercise the migration's conversion against invoices that actually existed beforehand, rather than only against an empty table. **Done with real data**: four invoices (one full month, one starting mid-month, one ending mid-month, one second-invoice) were generated in the old shape first, and the migration converted all four — every amount, rate and count matched the recorded baseline exactly.
- [x] 5.16 Remove the verification data, leaving the database as it was found.
