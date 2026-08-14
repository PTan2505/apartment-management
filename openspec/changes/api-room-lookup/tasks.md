## 1. Implementation

- [x] 1.1 Create feature branch `feature/api-room-lookup` off `dev`
- [x] 1.2 Add an optional `roomCode` field to `listRoomsQuerySchema` in `backend/src/modules/rooms/schema.ts`
- [x] 1.3 Apply an exact-match `roomCode` condition in the `listRooms` `where` clause in `backend/src/modules/rooms/service.ts`, combinable with the existing building and include-retired filters

## 2. Verification

- [x] 2.1 Verify filtering by building id and room code returns only that building's active room with exactly that code
- [x] 2.2 Verify filtering by room code alone returns one entry per building that has an active room with that code
- [x] 2.3 Verify matching is exact: filtering by a code that is a prefix or substring of others (e.g. `10` against `101`, `102`) returns only an exact match
- [x] 2.4 Verify a reused code with retired history returns both rooms when retired ones are explicitly requested
- [x] 2.5 Verify a code with no match returns HTTP 200 and an empty list
- [x] 2.6 Verify the existing filters still behave as before when no room code is supplied
- [x] 2.7 Verify the endpoint still returns 401 unauthenticated and 403 for a non-owner role

## 3. Wrap-up

- [x] 3.1 Run `tsc --noEmit` and confirm it passes
- [x] 3.2 Clean up verification data, leaving the seeded owner intact
- [x] 3.3 Commit on `feature/api-room-lookup`
