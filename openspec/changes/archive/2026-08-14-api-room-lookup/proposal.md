## Why

An owner thinks in room codes — "101 in Sunrise" — not in database ids. Today the only way to find that room is to list a building's rooms and scan the response, because there is no way to search by code.

The search is deliberately *not* a path identifier (`GET /rooms/101`), because a room code cannot identify a room on its own: the same code may exist in different buildings, and a code is reusable once its room is retired, so a building can hold both a retired `101` and an active `101`. The integer id remains the stable identity; the room code is a human label scoped to a building at a point in time.

## What Changes

- Add an optional `search` filter to the room listing endpoint, matching any room whose code contains the given text, combinable with the existing building and include-retired filters.
- Matching is **partial and case-insensitive**, mirroring the `search` parameter that `/customers` already provides. This is a lookup affordance for a person scanning a list, not an exact-identifier fetch — searching `10` is expected to surface `10`, `101` and `102` so the owner can pick the right one.
- Naming the parameter `search` rather than `roomCode` keeps one convention across the API and avoids implying an exact identifier match that the endpoint does not perform.
- No new endpoint, no change to how rooms are addressed, and no change to any existing filter's behavior.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `room`: "Owner can list and retrieve rooms" — listing gains an optional partial, case-insensitive room-code search.

## Impact

- **Code**: `backend/src/modules/rooms/schema.ts` (query schema) and `backend/src/modules/rooms/service.ts` (list `where` clause). Nothing else.
- **Database**: none. No schema change and no migration. Note that a `contains` match cannot use the existing `(buildingId, roomCode)` index, so this is a sequential scan over the building's rooms — irrelevant at the expected scale of low hundreds of rooms, but worth knowing if room volume ever grows sharply.
- **API surface**: `GET /rooms` accepts an additional optional query parameter. Existing calls are unaffected.
- **Dependencies**: none.
- **Out of scope**: no lookup by code as a path segment, no exact-code filter alongside the search, and no equivalent search for buildings or leases.
