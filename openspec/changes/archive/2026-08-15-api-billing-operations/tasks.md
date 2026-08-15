## 1. Branch & schema

- [x] 1.1 Create feature branch `feature/api-billing-operations` off `dev`
- [x] 1.2 Add `startMeterReading` (Int, required) and `endMeterReading` (Int, nullable) to the `Lease` model
- [x] 1.3 Add the `Invoice` model: `leaseId`, `year`, `month`, `periodStart`, `periodEnd`, `previousElectricityUse`, `currentElectricityUse`, snapshots (`electricityRate`, `waterRatePerPerson`, `baseRent`, `occupantCount`), amounts (`rentAmount`, `electricityAmount`, `waterAmount`, `totalAmount`), `paymentStatus`, `paymentMethod` (nullable), `paidAt` (nullable), `voidedAt` (nullable), timestamps, and a `leaseId` index
- [x] 1.4 Add the `PaymentMethod` enum (`cash`, `bank_transfer`)
- [x] 1.5 Generate the migration with `--create-only`
- [x] 1.6 Hand-edit the migration to add the partial unique index on (`leaseId`, `year`, `month`) `WHERE "voidedAt" IS NULL`
- [x] 1.7 Apply the migration and confirm the partial index exists in the database
- [x] 1.8 Regenerate the Prisma client and confirm `Invoice` is typed and usable

## 2. Lease meter readings (modified behavior)

- [x] 2.1 Accept an optional `startMeterReading` on lease creation, rejecting negative values
- [x] 2.2 Default it to the closing reading of the room's most recent finalized lease when omitted
- [x] 2.3 Reject creation with 400 when omitted and the room has no previous lease
- [x] 2.4 Accept a starting reading lower than the previous closing reading (meter replacement) without special handling
- [x] 2.5 Require `endMeterReading` on move-out
- [x] 2.6 Reject a closing reading below the lease's `startMeterReading` (400)
- [x] 2.7 Reject a closing reading below that lease's most recent invoice's closing reading (400)
- [x] 2.8 Include both readings in lease responses

## 3. Billing calculation

- [x] 3.1 Create `backend/src/modules/invoices/` with `schema.ts`, `service.ts`, `controller.ts`, `router.ts`
- [x] 3.2 Implement opening-reading resolution: the lease's `startMeterReading` for its first invoice, otherwise that lease's previous invoice's closing reading
- [x] 3.3 Implement the occupied-days calculation for a lease and month, counting the first and last day inclusively and using the month's actual length
- [x] 3.4 Implement charge computation: rent and water prorated by the day factor, electricity from consumption × rate with no proration
- [x] 3.5 Round each charge to whole units and set the total to their sum
- [x] 3.6 Snapshot `electricityRate`, `waterRatePerPerson`, `baseRent`, and `occupantCount` onto the invoice

## 4. Invoice generation

- [x] 4.1 Implement generation for a lease, year, and month with a supplied closing meter reading
- [x] 4.2 Reject an unknown lease with 404
- [x] 4.3 Reject a month that does not overlap the lease's occupancy period with 400
- [x] 4.4 Allow generation for a finalized lease covering that month
- [x] 4.5 Reject a closing reading below the resolved opening reading with 400
- [x] 4.6 Reject a duplicate for the same lease and month with `ConflictError`, ignoring voided invoices
- [x] 4.7 Mount the invoices router in `backend/src/server.ts` under `/invoices`, guarded by `authenticate` + `requireRole("owner")`

## 5. Payment, void, and listing

- [x] 5.1 Implement marking an invoice paid with method and payment date, rejecting an already paid invoice with 409
- [x] 5.2 Reject an invalid payment method with 400 and leave the invoice pending
- [x] 5.3 Implement voiding, rejecting an already voided invoice with 409
- [x] 5.4 Exclude voided invoices from listings by default and from any totals
- [x] 5.5 Implement list filtering by building, room, lease, year and month, and payment status
- [x] 5.6 Apply the shared pagination helper to the invoice listing
- [x] 5.7 Implement retrieve by id, returning 404 when unknown

## 6. Verification — lease meter readings

- [x] 6.1 Verify creating a lease without a starting reading, on a room with a previous finalized lease, defaults to that lease's closing reading
- [x] 6.2 Verify creating the first lease for a room without a starting reading returns 400
- [x] 6.3 Verify an overridden starting reading higher than the previous closing reading is accepted (vacancy)
- [x] 6.4 Verify a starting reading lower than the previous closing reading is accepted (meter replacement)
- [x] 6.5 Verify a negative starting reading returns 400
- [x] 6.6 Verify move-out requires a closing reading, and rejects one below the lease's starting reading (400)
- [x] 6.7 Verify move-out rejects a closing reading below the lease's most recent invoiced reading (400)

## 7. Verification — calculation

- [x] 7.1 Verify a full-month invoice charges full rent and full water, with electricity from consumption
- [x] 7.2 Verify a lease starting mid-month prorates rent and water by the days from the start date to month end
- [x] 7.3 Verify a lease ending mid-month prorates by the days up to and including the move-out date
- [x] 7.4 Verify a lease both starting and ending within one month prorates to just those days
- [x] 7.5 Verify electricity is NOT prorated: the same consumption yields the same charge in a full and a partial month
- [x] 7.6 Verify proration uses the month's actual length by comparing an equivalent occupancy in February and a 31-day month
- [x] 7.7 Verify the total equals the sum of the three rounded charges
- [x] 7.8 Verify a lease's first invoice opens from `startMeterReading`, and its second opens from the first's closing reading
- [x] 7.9 Verify a new tenancy is not charged for the previous tenancy's consumption
- [x] 7.10 Verify a closing reading below the opening reading returns 400

## 8. Verification — lifecycle

- [x] 8.1 Verify a duplicate invoice for the same lease and month returns 409
- [x] 8.2 Verify two leases occupying one room in the same month can each be invoiced
- [x] 8.3 Verify changing a building rate after issuing does not alter the issued invoice
- [x] 8.4 Verify changing a lease's occupant count after issuing does not alter the issued invoice
- [x] 8.5 Verify a new invoice is pending with no method or paid date
- [x] 8.6 Verify marking paid records method and paid date, and that a second attempt returns 409
- [x] 8.7 Verify an invalid payment method returns 400
- [x] 8.8 Verify a paid date in a later month is retained distinctly from the billed month
- [x] 8.9 Verify voiding excludes the invoice from listings and allows reissuing the same lease and month
- [x] 8.10 Verify voiding an already voided invoice returns 409
- [x] 8.11 Verify the DB partial index rejects a duplicate non-voided invoice inserted directly
- [x] 8.12 Verify list filters by building, room, lease, month, and payment status, and that listing is paginated
- [x] 8.13 Verify invoice endpoints return 401 unauthenticated and 403 for a non-owner role

## 9. Wrap-up

- [x] 9.1 Run `tsc --noEmit` and confirm it passes
- [x] 9.2 Confirm all new imports follow the `@/` alias convention
- [x] 9.3 Clean up verification data, leaving the seeded owner intact
- [x] 9.4 Commit work in atomic commits per completed task group, on `feature/api-billing-operations`
