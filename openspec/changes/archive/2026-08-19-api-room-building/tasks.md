## 1. Endpoint

- [x] 1.1 Create feature branch `feature/api-room-building` off `dev`
- [x] 1.2 Add a `roomSelect` constant in the rooms service listing the room's own fields plus a nested building limited to id and display name, mirroring the explicit-selection pattern used elsewhere
- [x] 1.3 Apply it to `listRooms`, so every listed room carries its building
- [x] 1.4 Apply it to `getRoomById`
- [x] 1.5 Apply it to the create, update, retire, and restore responses, so a room is shaped the same however it was obtained
- [x] 1.6 Keep `buildingId` on the room, so a caller reading it is unaffected
- [x] 1.7 Run `tsc --noEmit` and confirm it passes

## 2. Verification — shape

- [x] 2.1 Verify a listed room carries a nested building with its id and display name
- [x] 2.2 Verify a retrieved single room carries the building in the same form
- [x] 2.3 Verify the create, update, retire, and restore responses each carry it too
- [x] 2.4 Verify the nested building carries no rates, address, or active state
- [x] 2.5 Verify `buildingId` is still present as a direct field alongside the nested building
- [x] 2.6 Verify a retired room reports its building exactly as an active one does

## 3. Verification — behaviour unchanged

- [x] 3.1 Verify two rooms sharing a code in different buildings are distinguishable by their reported buildings
- [x] 3.2 Verify filtering by `buildingId` still returns only that building's rooms
- [x] 3.3 Verify searching by room code still matches partially and ignores case
- [x] 3.4 Verify paging still reports totals for the filtered and searched set
- [x] 3.5 Verify an unauthenticated request still returns 401 and a non-owner 403
- [x] 3.6 Verify a room id that does not exist still returns 404
- [x] 3.7 Verify `baseRent` is still a number, confirming the added selection did not disturb Decimal serialisation

## 4. Wrap-up

- [x] 4.1 Run `tsc --noEmit` and confirm it passes
- [x] 4.2 Confirm all new imports use the `@/` alias and none use `../`
- [x] 4.3 Update the local OpenAPI document's Room schema to carry the nested building
- [x] 4.4 Clean up verification data, leaving the seeded owner and the existing building intact
- [ ] 4.5 Report the work for review, and commit only when asked
