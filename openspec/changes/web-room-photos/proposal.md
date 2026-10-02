## Why

A room is a price and a code. Nothing in the system shows what it looks like.

That matters at the moment a room is let: the owner describes it over the phone, or
sends photographs from their camera roll that nobody can match back to P402 afterwards.
It matters again when a tenancy ends and the two sides disagree about what the room was
like when it started.

The system already photographs three other things — a damage report, a signed contract,
an ID card — through the same presigned-upload route. A room is the obvious fourth and
the only one of the four that is missing.

## What Changes

- **A room carries photographs.** The owner or a manager uploads them; they belong to the
  room and outlive every tenancy in it.
- **They are shown on the room's own page**, and the first one stands in for the room as
  a thumbnail in the rooms list. Fifty-eight rows of text is hard to scan; a picture in
  the first column is how people recognise a room.
  - The thumbnail goes beyond what was asked ("show on room detail"). It is called out
    here so it can be dropped without unpicking the rest.
- **A manager may upload**, though a manager may not edit a room. A photograph is
  operating the building, not pricing it — but it is a deliberate exception to a rule
  set a week ago, so it is stated rather than slipped in.
- Photographs are NOT shown to tenants. The portal is untouched.

## Capabilities

### Modified Capabilities

- `room`: a room carries photographs, uploaded without their bytes passing through the API.
- `web-rooms`: the room's page shows them, the list shows the first, and both offer
  upload and removal to the roles that may.

## Impact

- Affected specs: `room`, `web-rooms`
- Affected code: `backend/prisma/schema.prisma` (one table, + migration),
  `backend/src/lib/storage.ts` (a fourth key prefix and content-type set),
  `backend/src/modules/rooms/*`, and the rooms screens
- No change to tenancies, billing, or the portal.
- Storage: the same R2 bucket and the same three-step upload the other three use. Where
  storage is not configured the feature says so, exactly as contract pages already do.
