## 1. Branch & shared authorization

- [x] 1.1 Create feature branch `feature/api-property-room` off `dev`
- [x] 1.2 Add `ForbiddenError` (403) to `backend/src/lib/errors.ts`
- [x] 1.3 Create `backend/src/middleware/require-role.ts` as a factory: `requireRole("owner")` reads `req.user` and throws `ForbiddenError` when the role does not match
- [x] 1.4 Confirm `requireRole` behaves correctly when mounted after `authenticate` (401 for no token, 403 for wrong role, pass-through for owner)

## 2. Prisma models & migration

- [x] 2.1 Add `Building` model: `id`, `displayName`, `address`, `electricityRate` (Decimal), `waterRatePerPerson` (Decimal), `isActive` (default true), `createdAt`, `updatedAt`
- [x] 2.2 Add `Room` model: `id`, `buildingId` (FK), `roomCode`, `baseRent` (Decimal), `isActive` (default true), `createdAt`, `updatedAt`, plus the `Building` relation and a `buildingId` index
- [x] 2.3 Run `prisma migrate dev` to generate the migration
- [x] 2.4 Hand-edit the generated migration to add the partial unique index: unique on (`buildingId`, `roomCode`) `WHERE "isActive" = true`
- [x] 2.5 Re-apply the migration and confirm the partial index exists in the database
- [x] 2.6 Regenerate the Prisma client and confirm both models are typed and usable

## 3. Buildings module

- [x] 3.1 Create `backend/src/modules/buildings/schema.ts` — zod schemas for create, update, and list query (including the include-inactive flag), rejecting negative rates
- [x] 3.2 Create `backend/src/modules/buildings/service.ts` — create, list (active-only by default), get by id, update, retire, restore
- [x] 3.3 Create `backend/src/modules/buildings/controller.ts` — request/response handling delegating to the service
- [x] 3.4 Create `backend/src/modules/buildings/router.ts` — routes guarded by `authenticate` + `requireRole("owner")`
- [x] 3.5 Mount the buildings router in `backend/src/server.ts` under `/buildings`

## 4. Rooms module

- [x] 4.1 Create `backend/src/modules/rooms/schema.ts` — zod schemas for create, update, and list query (building filter, include-inactive flag), rejecting negative base rent
- [x] 4.2 Create `backend/src/modules/rooms/service.ts` — create, list (filterable by building, active-only by default), get by id, update, retire, restore
- [x] 4.3 Enforce that room creation targets an existing, active building (404 when missing, 400 when retired)
- [x] 4.4 Enforce active-scoped room-code uniqueness on create and update, raising `ConflictError` on duplicates
- [x] 4.5 Enforce the uniqueness recheck on restore, raising `ConflictError` when the code was reused by an active room
- [x] 4.6 Create `backend/src/modules/rooms/controller.ts` — request/response handling delegating to the service
- [x] 4.7 Create `backend/src/modules/rooms/router.ts` — routes guarded by `authenticate` + `requireRole("owner")`
- [x] 4.8 Mount the rooms router in `backend/src/server.ts` under `/rooms`

## 5. Verification — authorization

- [x] 5.1 Verify building and room endpoints return 401 with no access token
- [x] 5.2 Verify they return 403 for a valid token whose role is not `owner`
- [x] 5.3 Verify they succeed for an authenticated owner

## 6. Verification — buildings

- [x] 6.1 Verify creating a building succeeds and returns 201
- [x] 6.2 Verify a negative electricity or water rate is rejected with 400
- [x] 6.3 Verify listing excludes retired buildings by default and includes them when explicitly requested
- [x] 6.4 Verify retrieving and updating an unknown building id returns 404
- [x] 6.5 Verify retiring a building removes it from default listings while its record persists, and that restoring it brings it back
- [x] 6.6 Verify retiring a building leaves its rooms individually active

## 7. Verification — rooms

- [x] 7.1 Verify creating a room in an active building succeeds and returns 201
- [x] 7.2 Verify creating a room against an unknown building returns 404, and against a retired building returns 400
- [x] 7.3 Verify a duplicate room code within the same building returns 409
- [x] 7.4 Verify the same room code succeeds in a different building
- [x] 7.5 Verify a retired room's code can be reused by a new room
- [x] 7.6 Verify restoring a room whose code was reused returns 409 and leaves it retired
- [x] 7.7 Verify listing filtered by building returns only that building's active rooms

## 8. Wrap-up

- [x] 8.1 Run `tsc --noEmit` and confirm it passes
- [x] 8.2 Confirm all new imports follow the `@/` alias convention
- [x] 8.3 Commit work in atomic commits per completed task group, on `feature/api-property-room`
