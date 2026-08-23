## 1. Branch & schema

- [x] 1.1 Create feature branch `feature/api-expenses` off `dev`
- [x] 1.2 Add the `ExpenseCategory` enum (`vacancy_electricity`, `cleaning`, `repair`, `other`), `ExpenseOrigin` enum (`system`, `manual`), and `VacancyReconciliation` enum (`month_end`, `lease_start`)
- [x] 1.3 Add the `Expense` model: `buildingId`, `roomId` (nullable), `category`, `description`, `quantity` (nullable), `unitRate` (nullable), `amount`, `incurredAt`, `origin`, `reconciliation` (nullable, vacancy records only), `year` (nullable), `month` (nullable), `previousReading` (nullable), `currentReading` (nullable), timestamps, and indexes on `buildingId` and `roomId`
- [x] 1.4 Generate the migration with `--create-only`
- [x] 1.5 Hand-edit the migration to add the partial unique index on (`roomId`, `year`, `month`) `WHERE "category" = 'vacancy_electricity' AND "reconciliation" = 'month_end'`
- [x] 1.6 Apply the migration and confirm the partial index exists in the database
- [x] 1.7 Regenerate the Prisma client and confirm `Expense` is typed and usable

## 2. Meter history resolution

- [x] 2.1 Create a shared helper resolving a room's latest known meter reading across `Lease.startMeterReading`, `Lease.endMeterReading`, and vacancy expense closing readings, taking the most recent by date
- [x] 2.2 Restructure `resolveStartMeterReading` in the leases service so it always fetches the room's latest known reading, rather than returning early when the owner supplies one
- [x] 2.3 Change the lease creation default to use the room's latest known reading
- [x] 2.4 Keep the existing behaviour that omitting the reading on a room with no history returns 400

## 3. Expenses module

- [x] 3.1 Create `backend/src/modules/expenses/` with `schema.ts`, `service.ts`, `controller.ts`, `router.ts`
- [x] 3.2 Implement manual expense creation, validating that the amount is above zero and that a named room belongs to the named building
- [x] 3.3 Return 404 for an unknown building or room, and 400 when the room is in a different building
- [x] 3.4 Compute the amount from quantity × unit rate (rounded) when both are supplied, ignoring any amount sent by the caller; require an amount otherwise
- [x] 3.5 Implement update and delete, allowing both on system-generated records; delete removes the row outright
- [x] 3.6 Implement list filtering by building, room, category, and incurred date range, applying the shared pagination helper
- [x] 3.7 Implement retrieve by id, returning 404 when unknown
- [x] 3.8 Mount the expenses router in `backend/src/server.ts` under `/expenses`, guarded by `authenticate` + `requireRole("owner")`

## 4. Vacancy electricity — month end

- [x] 4.1 Implement recording a month-end vacancy reading for a room, year, and month
- [x] 4.2 Resolve the opening reading from the room's latest known reading
- [x] 4.3 Reject with 400 when the room had an active lease at that month's end
- [x] 4.4 Reject with 400 when the supplied reading is below the room's latest known reading
- [x] 4.5 Create no expense when the reading equals the latest known reading, reporting that there was nothing to charge
- [x] 4.6 Compute the amount from the consumed units at the building's electricity rate, storing both readings, the quantity, and the rate
- [x] 4.7 Date the expense the last day of that month, record `year` and `month`, and set `reconciliation` to `month_end` so the partial index applies
- [x] 4.8 Reject a duplicate for the same room and month with `ConflictError`

## 5. Vacancy electricity — new lease

- [x] 5.1 In lease creation, compare the resolved opening reading against the room's latest known reading
- [x] 5.2 Create a vacancy expense for a positive difference, dated the lease's start date, with `year` and `month` taken from that date and `reconciliation` set to `lease_start`
- [x] 5.3 Create no expense when the opening reading equals or is below the latest known reading (a replaced meter is a new baseline, not a credit)
- [x] 5.4 Write the lease, its primary occupant, and the vacancy expense in a single transaction

## 6. Verification — manual expenses

- [x] 6.1 Verify recording a building-level expense returns 201
- [x] 6.2 Verify recording a room-level expense associates it with the room
- [x] 6.3 Verify a room in a different building returns 400, and an unknown building or room returns 404
- [x] 6.4 Verify an amount of zero or below returns 400
- [x] 6.5 Verify quantity × rate computes the amount, ignoring a conflicting supplied amount
- [x] 6.6 Verify a flat amount with no quantity is recorded as given
- [x] 6.7 Verify update and delete work, including on a system-generated record, and that delete removes the row entirely
- [x] 6.8 Verify deleting an unknown expense returns 404
- [x] 6.9 Verify list filters by building, room, category, and date range, and that listing is paginated
- [x] 6.10 Verify expense endpoints return 401 unauthenticated and 403 for a non-owner role

## 7. Verification — vacancy at month end

- [x] 7.1 Verify the first vacant month after a tenancy opens from that lease's closing reading
- [x] 7.2 Verify a second consecutive vacant month opens from the previous vacancy expense's closing reading
- [x] 7.3 Verify an unchanged meter creates no expense
- [x] 7.4 Verify a reading below the latest known reading returns 400
- [x] 7.5 Verify a room occupied at that month's end returns 400
- [x] 7.6 Verify a duplicate for the same room and month returns 409
- [x] 7.7 Verify the DB partial index rejects a duplicate month_end vacancy for a room and month inserted directly, while permitting two lease_start records in the same month
- [x] 7.8 Verify a room can hold both an invoice and a vacancy expense for the same month when a lease ended partway through it
- [x] 7.9 Verify the amount equals consumed units × the building's electricity rate, with both readings retained

## 8. Verification — vacancy at lease creation

- [x] 8.1 Verify creating a lease with an opening reading above the room's latest known reading generates a vacancy expense for the difference, dated the lease start
- [x] 8.2 Verify an opening reading equal to the latest known reading generates no expense
- [x] 8.3 Verify an opening reading below the latest known reading (replaced meter) generates no expense
- [x] 8.4 Verify a short vacancy that never met a month end is still charged when the next lease starts
- [x] 8.5 Verify the lease default now follows a vacancy reading recorded after the previous tenancy ended, not the previous lease's closing reading
- [x] 8.6 Verify the lease and its expense are written together, with neither persisting if the other fails

## 9. Wrap-up

- [x] 9.1 Run `tsc --noEmit` and confirm it passes
- [x] 9.2 Confirm all new imports follow the `@/` alias convention
- [x] 9.3 Clean up verification data, leaving the seeded owner intact
- [x] 9.4 Commit work in atomic commits per completed task group, on `feature/api-expenses`
