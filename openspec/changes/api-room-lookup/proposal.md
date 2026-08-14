## Why

An owner thinks in room codes — "101 in Sunrise" — not in database ids. Today the only way to find that room is to list a building's rooms and scan the response, because `roomCode` is not a filter. This adds it as a filter on the existing list endpoint.

It is deliberately *not* added as a path identifier (`GET /rooms/101`), because a room code cannot identify a room on its own: the same code may exist in different buildings, and a code is reusable once its room is retired, so a building can hold both a retired `101` and an active `101`. The integer id remains the stable identity; the room code is a human label scoped to a building at a point in time.

## What Changes

- Add an optional `roomCode` filter to the room listing endpoint, combinable with the existing building and include-retired filters.
- Matching is exact, not a partial or fuzzy search — a room code is an identifier, and a substring match on "10" returning 101, 102, and 210 would be surprising when the caller is looking up one specific room.
- No new endpoint, no change to how rooms are addressed, and no change to any existing filter's behavior.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `room`: "Owner can list and retrieve rooms" — listing gains an optional room-code filter.

## Impact

- **Code**: `backend/src/modules/rooms/schema.ts` (query schema) and `backend/src/modules/rooms/service.ts` (list `where` clause). Nothing else.
- **Database**: none. No schema change and no migration; the existing `(buildingId, roomCode)` partial index already covers the common filtered lookup.
- **API surface**: `GET /rooms` accepts an additional optional query parameter. Existing calls are unaffected.
- **Dependencies**: none.
- **Out of scope**: no fuzzy or partial matching, no lookup by code as a path segment, and no equivalent filter for buildings or leases.
