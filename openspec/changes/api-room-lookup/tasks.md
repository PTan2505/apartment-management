## 1. Implementation

- [x] 1.1 Create feature branch `feature/api-room-lookup` off `dev`
- [x] 1.2 Add an optional `search` field to `listRoomsQuerySchema` in `backend/src/modules/rooms/schema.ts`
- [x] 1.3 Apply a partial, case-insensitive `roomCode` condition in the `listRooms` `where` clause in `backend/src/modules/rooms/service.ts`, combinable with the existing building and include-retired filters

## 2. Verification

- [x] 2.1 Verify searching within a building returns only that building's active rooms whose code contains the text
- [x] 2.2 Verify searching by a code fragment returns every room containing it (searching `10` returns `10`, `101` and `102`)
- [x] 2.3 Verify the search ignores case
- [x] 2.4 Verify searching without a building returns one entry per building that has a matching active room
- [x] 2.5 Verify a reused code with retired history returns both rooms when retired ones are explicitly requested
- [x] 2.6 Verify a search with no match returns HTTP 200 and an empty list
- [x] 2.7 Verify the existing filters still behave as before when no search text is supplied
- [x] 2.8 Verify the endpoint still returns 401 unauthenticated and 403 for a non-owner role

## 3. Wrap-up

- [x] 3.1 Run `tsc --noEmit` and confirm it passes
- [x] 3.2 Clean up verification data, leaving the seeded owner intact
- [x] 3.3 Commit on `feature/api-room-lookup`
