# Tasks

## 1. Capture the baseline

- [x] 1.1 Before touching anything, generate invoices for a lease with **no** service fees — a full month and a partial month — and record every charge and total. Rent, electricity and water must not move, and this is what that is measured against. **Captured**: full month 3,000,000 / 175,000 / 200,000 = 3,375,000; partial month 1,645,161 / 105,000 / 164,516 = 1,914,677.

## 2. Effective periods on a lease's fees

- [x] 2.1 Add `effectiveFrom` and nullable `effectiveTo` to `LeaseServiceFee`, following how `LeaseOccupant` records `joinedAt` and `leftAt`.
- [x] 2.2 Replace the unconditional unique index with a partial one on the rows still applying, so a fee given up can be taken again. Prisma cannot express it, so it goes in the migration by hand — the same as the index it replaces.
- [x] 2.3 Backfill `effectiveFrom` from each row's lease start date. Every existing row was selected at lease creation, and the start date is the only defensible value.
- [x] 2.4 Apply the migration and run `prisma generate`.
- [x] 2.5 Accept an optional `effectiveFrom` when selecting a fee, defaulting to the lease's start date — **not** to today, which would under-charge every fee entered late. Reject a date before the lease started.
- [x] 2.6 Change removal to record `effectiveTo` instead of deleting. Default to today, allow it to be supplied, reject a date before the fee began.
- [x] 2.7 Adjust the duplicate check to consider only fees still applying, so a fee given up may be taken again.
- [x] 2.8 Report the effective period wherever a lease's fees are listed, including those given up.

## 3. Charging them

- [x] 3.1 Add `serviceFee` to `InvoiceLineKind`, and a nullable reference from a line to the building fee it came from.
- [x] 3.2 At generation, resolve the fees whose effective period **overlaps the billed period** — not the fees the lease holds now. The second is what an on-time test cannot distinguish from the first.
- [x] 3.3 Charge each at its agreed unit amount and quantity, prorated by the intersection of the occupied days and the fee's own period.
- [x] 3.4 Name the fee in the line's description, so a tenant can tell parking from internet.
- [x] 3.5 Include the fees in the total, keeping it equal to the sum of the lines.
- [x] 3.6 Do not touch `computeCharges`. Rent, electricity and water are produced exactly as before.
- [x] 3.7 Run `tsc --noEmit`.

## 4. Verification against the running API

Failure paths included, not just the happy path.

- [x] 4.1 **An invoice for a lease with no service fees is identical to the task 1.1 baseline** — every charge and the total. Checked first, before anything with fees. **Result**: both invoices reproduced every charge, total and line count exactly.
- [x] 4.2 A lease holding one fee produces an extra line naming it, and a total larger by exactly that fee.
- [x] 4.3 Three fees produce three separate named lines, not one combined charge.
- [x] 4.4 The total equals the sum of every line including the fees.
- [x] 4.5 A fee applying for a whole month over a full tenancy is charged in full.
- [x] 4.6 **A fee given up on the 15th of a 31-day month is charged 14 days** — check the arithmetic, not just that it is smaller. **Result**: 90,323 = 200,000 × 14/31, exact.
- [x] 4.7 A fee taken up on the 15th is charged for the rest of the month.
- [x] 4.8 **An invoice for a month after a fee was given up does not charge it** — the case the wrong implementation gets wrong. **Result**: April charged Internet and Rubbish only; Parking absent.
- [x] 4.9 **An invoice for a month before a fee was taken up does not charge it**, even though the lease holds it now. **Result**: February charged Parking, Internet, Rubbish — Laundry absent despite the lease holding it today.
- [x] 4.10 A fee applying throughout a tenancy that ended mid-month is charged for the tenancy's days, not the fee's whole window.
- [x] 4.11 Giving up a fee retains it in the lease's listing with its period, rather than removing it.
- [x] 4.12 A fee given up can be taken again, both periods are kept, and the duplicate check still refuses adding one the lease currently holds.
- [x] 4.13 Selecting a fee with an `effectiveFrom` before the lease start returns 400; giving one up before it began returns 400.
- [x] 4.14 Repricing a building fee after an invoice was issued leaves that invoice's line reporting the old amount.
- [x] 4.15 Confirm the revenue report still reads only the total and needs no change.
- [x] 4.16 Remove the verification data, leaving the database as it was found.
