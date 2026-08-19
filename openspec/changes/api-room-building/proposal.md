## Why

A room response carries `buildingId` and nothing else about the building it belongs to:

```
{ "id": 27, "buildingId": 45, "roomCode": "A-101", "baseRent": 3000000, … }
```

A room code identifies a room only within its building — the same code may exist in several buildings, and the API's own search returns one entry per matching building for exactly that reason. So a list of rooms without their buildings is ambiguous, and `45` is not something to show anyone.

Every client displaying rooms therefore has to fetch buildings separately and join by id, on every screen that shows a room. That is work the API can do once, and it is a shape problem rather than a client problem: the ambiguity is in the response, not in how any particular client renders it.

## What Changes

- Room responses carry the building they belong to — its id and display name — instead of only a foreign key.
- This applies wherever a room is returned: listing and retrieval alike, so no caller has to know which endpoints are complete and which are not.
- **BREAKING** in the additive sense: `buildingId` remains, so nothing that reads it stops working. Responses grow a nested building.

### Why the name and not the whole building

A room list needs to say which building each room is in. It does not need the building's rates, address, or status — those belong to the building's own screens, and including them would make every room response carry data that is stale the moment a rate changes.

The id travels with the name so a client can link or filter without a second lookup.

## Capabilities

### Modified Capabilities
- `room`: "Owner can list and retrieve rooms" — a room now reports the building it belongs to, not merely its id.

### New Capabilities
(none)

## Impact

- **Code**: `backend/src/modules/rooms/service.ts` only — an explicit selection on the existing queries. No controller, router, or schema change.
- **Database**: none. No schema change, no migration; the relation already exists and is already indexed by `buildingId`.
- **API surface**: no new endpoints. Existing room responses gain a nested building.
- **Behavioral change**: none to filtering, searching, paging, or any other endpoint. `buildingId` is unchanged, so an existing consumer reading it is unaffected.
- **Dependencies**: none. This blocks `web-rooms`, which shows rooms alongside their buildings on both the rooms screen and a building's own page.
- **Out of scope**: no building on lease, invoice, or expense responses — each is a separate decision about what that resource's clients need, and guessing now would add payload nobody asked for. No change to how rooms are searched or filtered.
