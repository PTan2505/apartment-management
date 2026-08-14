## 1. Branch & Prisma models

- [x] 1.1 Create feature branch `feature/api-lease-management` off `dev`
- [x] 1.2 Make `User.phone` nullable in `prisma/schema.prisma`, keeping it unique
- [x] 1.3 Add `Lease` model: `id`, `roomId` (FK to `Room`), `startDate`, `durationMonths` (Int), `occupantCount` (Int), `moveOutDate` (nullable), `createdAt`, `updatedAt`, plus the room relation and a `roomId` index — deliberately no `tenantId` column
- [x] 1.4 Add `LeaseOccupant` model: `id`, `leaseId` (FK), `userId` (FK to `User`), `isPrimary` (Bool), `joinedAt`, `leftAt` (nullable), `createdAt`, `updatedAt`, plus indexes on `leaseId` and `userId`
- [x] 1.5 Add the `leases` / `leaseOccupants` back-relations to `User` and `Room`
- [x] 1.6 Generate the migration with `prisma migrate dev --create-only`
- [x] 1.7 Hand-edit the migration to add three partial unique indexes: `Lease(roomId) WHERE moveOutDate IS NULL`; `LeaseOccupant(leaseId) WHERE isPrimary AND leftAt IS NULL`; `LeaseOccupant(leaseId, userId) WHERE leftAt IS NULL`
- [x] 1.8 Apply the migration and confirm all three partial indexes exist in the database
- [x] 1.9 Confirm the `User.phone` column is now nullable and the seeded owner is unaffected
- [x] 1.10 Regenerate the Prisma client and confirm both new models are typed and usable

## 2. Customers module

- [x] 2.1 Create `backend/src/modules/customers/schema.ts` — zod schemas for register (phone optional), update, and list query
- [x] 2.2 Create `backend/src/modules/customers/service.ts` — register, list, get by id, update; every query scoped to `role = customer`
- [x] 2.3 Implement register semantics: 201 for a new person; 200 returning the existing record when a supplied phone already belongs to a `customer`; `ConflictError` when it belongs to an `owner`; always create when no phone is supplied
- [x] 2.4 Ensure no response includes `passwordHash` (explicit field selection, not deletion after the fact)
- [x] 2.5 Enforce phone uniqueness on update, including setting a phone on a record that had none
- [x] 2.6 Create `backend/src/modules/customers/controller.ts` and `router.ts`, guarded by `authenticate` + `requireRole("owner")`
- [x] 2.7 Mount the customers router in `backend/src/server.ts` under `/customers`

## 3. Lease core & derived fields

- [x] 3.1 Create `backend/src/modules/leases/schema.ts` — zod schemas for create, update, move-out, occupant add/remove/transfer, and list query (filters: roomId, customerId, active)
- [x] 3.2 Implement month arithmetic that clamps to the last valid day of the target month (31 Jan + 1 month → 28/29 Feb)
- [x] 3.3 Implement the derived-value mapper (`toLeaseResponse`) computing `expectedEndDate`, `status` from `moveOutDate`, and the current tenant from the primary occupant
- [x] 3.4 Apply the mapper to every lease response so no endpoint returns a raw lease row

## 4. Lease lifecycle

- [x] 4.1 Create `backend/src/modules/leases/service.ts` with create, list, get by id, update, and move-out
- [x] 4.2 Implement create in a transaction writing both the lease and its primary `LeaseOccupant` row
- [x] 4.3 Enforce on create that the signatory exists (404), has a phone (400), and that the room exists (404) and is active (400)
- [x] 4.4 Enforce one active lease per room on create, raising `ConflictError`
- [x] 4.5 Validate duration and occupant count are at least 1 on create and update
- [x] 4.6 Implement move-out: reject a date before the lease start date (400), reject an already-finalized lease (409), otherwise record it
- [x] 4.7 Cascade move-out to current occupants, setting their `leftAt` to the move-out date in the same transaction
- [x] 4.8 Reject updates to a finalized lease with `ConflictError`
- [x] 4.9 Implement list filtering by room, by active status, and by customer (matching any lease that person occupied, primary or not)
- [x] 4.10 Create `backend/src/modules/leases/controller.ts` and `router.ts`, guarded by `authenticate` + `requireRole("owner")`
- [x] 4.11 Mount the leases router in `backend/src/server.ts` under `/leases`

## 5. Lease occupants

- [x] 5.1 Implement adding an occupant: 404 for an unknown customer, `ConflictError` when they are already a current occupant
- [x] 5.2 Allow re-adding a person who previously departed, creating a new record and retaining the old one
- [x] 5.3 Implement recording a departure, rejecting a date earlier than that occupant's joined date (400)
- [x] 5.4 Reject recording a departure for the current primary occupant while other occupants remain (409)
- [x] 5.5 Implement transferring primary responsibility to another current occupant, in a transaction; reject transfer to a non-occupant (400)
- [x] 5.6 Implement listing a lease's occupants, including departed ones with their joined and departure dates
- [x] 5.7 Add the nested occupant routes under `/leases/:id/occupants`, guarded by the same middleware

## 6. Retire guards (modified behavior)

- [x] 6.1 Add an active-lease existence check to the rooms service and reject retiring an occupied room with `ConflictError`
- [x] 6.2 Add a building-level check (any room in the building with an active lease) and reject retiring such a building with `ConflictError`
- [x] 6.3 Confirm retiring still succeeds once the blocking lease records a move-out, at both room and building level

## 7. Verification — customers

- [x] 7.1 Verify registering a new person with a phone returns 201 and creates a `customer` with no password
- [x] 7.2 Verify registering a person with no phone returns 201, and that two such registrations create two distinct records
- [x] 7.3 Verify registering an existing customer phone returns 200 with the existing record, creating no duplicate
- [x] 7.4 Verify registering with an owner's phone returns 409 and leaves that account unchanged
- [x] 7.5 Verify customer listings exclude owner accounts and never include password material
- [x] 7.6 Verify setting a previously absent phone succeeds, and that a phone already in use returns 409
- [x] 7.7 Verify customer endpoints return 401 unauthenticated and 403 for a non-owner role

## 8. Verification — leases

- [x] 8.1 Verify creating a lease returns 201 and records the signatory as primary occupant
- [x] 8.2 Verify a signatory without a phone returns 400, and that no lease or occupant row is created
- [x] 8.3 Verify unknown signatory and unknown room return 404, and a retired room returns 400
- [x] 8.4 Verify duration or occupant count below 1 returns 400
- [x] 8.5 Verify a second lease on an occupied room returns 409
- [x] 8.6 Verify `expectedEndDate` is correct for a normal case (2026-01-15 + 12 months → 2027-01-15)
- [x] 8.7 Verify month-end clamping (31 Jan + 1 month → 28/29 Feb)
- [x] 8.8 Verify status reads active with no move-out date and finalized once one is recorded
- [x] 8.9 Verify move-out before the start date returns 400, and move-out on a finalized lease returns 409
- [x] 8.10 Verify move-out before the expected end date is accepted (early departure)
- [x] 8.11 Verify move-out marks current occupants as departed on that date
- [x] 8.12 Verify the room accepts a new lease after move-out, and the previous lease is retained as history
- [x] 8.13 Verify updating a finalized lease returns 409
- [x] 8.14 Verify list filters by room, by active status, and by customer (including leases where they were not primary)
- [x] 8.15 Verify lease endpoints return 401 unauthenticated and 403 for a non-owner role

## 9. Verification — occupants and occupant count

- [x] 9.1 Verify adding an occupant returns 201 and appears in the lease's occupant list
- [x] 9.2 Verify adding an unknown customer returns 404, and adding a current occupant again returns 409
- [x] 9.3 Verify re-adding a departed person creates a new record while the old one remains
- [x] 9.4 Verify a departure date before the joined date returns 400
- [x] 9.5 Verify the occupant list includes departed people with their joined and departure dates
- [x] 9.6 Verify transferring primary responsibility updates the reported tenant and keeps the previous primary as an occupant
- [x] 9.7 Verify transferring to a non-occupant returns 400
- [x] 9.8 Verify removing the current primary while others remain returns 409
- [x] 9.9 Verify a person departed from one lease and added to another resolves to the same customer id across both
- [x] 9.10 Verify `occupantCount` is unchanged by adding or removing occupants, and that a lease with count 5 and 2 recorded occupants is accepted and reports 5

## 10. Verification — retire guards and DB backstops

- [x] 10.1 Verify retiring a room with an active lease returns 409 and the room stays active
- [x] 10.2 Verify retiring that room succeeds after the lease records a move-out
- [x] 10.3 Verify retiring a building containing an occupied room returns 409 and the building stays active
- [x] 10.4 Verify retiring that building succeeds once all its leases are finalized
- [x] 10.5 Verify the DB rejects a duplicate active lease for a room when inserted directly, bypassing the service
- [x] 10.6 Verify the DB rejects a second active primary occupant and a duplicate active occupant when inserted directly

## 11. Wrap-up

- [x] 11.1 Run `tsc --noEmit` and confirm it passes
- [x] 11.2 Confirm all new imports follow the `@/` alias convention
- [x] 11.3 Clean up verification data, leaving the seeded owner intact
- [x] 11.4 Commit work in atomic commits per completed task group, on `feature/api-lease-management`
