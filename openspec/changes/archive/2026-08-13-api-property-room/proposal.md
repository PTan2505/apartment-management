## Why

Buildings and rooms are the foundation every remaining domain sits on: leases attach a tenant to a room, invoices bill a room using its building's utility rates, and revenue reports aggregate across buildings. None of that can be built until an owner can define which properties and rooms exist. This is also the first change to actually consume the `authenticate` middleware from `api-auth-module`, so it establishes how protected domain routes are guarded.

## What Changes

- Add a `Building` model: display name, address, electricity rate (per kWh), water rate (per person), and an `isActive` flag.
- Add a `Room` model: parent building, room code, base monthly rent, and an `isActive` flag.
- Add full CRUD endpoints for buildings and for rooms, all requiring an authenticated `owner`.
- Add a `requireRole` middleware that gates routes by user role, layered on top of the existing `authenticate` middleware. This is its first use, but every later domain module will apply it too.
- Deletion is soft only: setting `isActive = false` retires a building or room rather than removing the row, so future leases and invoices referencing it keep their history intact. There are no hard-delete endpoints.
- Room codes are unique among *active* rooms within a building, so retiring a room frees its code for reuse by a new room.
- No occupancy-status field on `Room`: whether a room is currently rented is derivable from lease data once `api-lease-management` exists, so storing it would only create drift.
- No meter-reading field on `Room`: each invoice will store both its previous and current electricity readings, so the "previous" value for a new invoice is read from that room's most recent invoice rather than from mutable state on the room.
- Deactivation guards ("cannot retire a building or room that has an active lease") are **not** enforced in this change — `Lease` does not exist yet, so there is nothing to check against. `api-lease-management` will add those guards as modifications to this change's specs once leases exist. Until then, deactivation is unconditional.

## Capabilities

### New Capabilities
- `building`: Managing apartment buildings — their identity, address, utility billing rates, and active/retired state.
- `room`: Managing rooms within a building — their code, base rent, and active/retired state.

### Modified Capabilities
(none)

## Impact

- **Code**: new `backend/src/modules/buildings/` and `backend/src/modules/rooms/` (router, controller, service, schema each); new `backend/src/middleware/require-role.ts`; new Prisma models and migration.
- **Database**: adds `Building` and `Room` tables. The room-code uniqueness rule needs a partial unique index (scoped to active rows), which Prisma cannot express in schema syntax alone.
- **API surface**: adds CRUD routes for `/buildings` and `/rooms`, all requiring an authenticated `owner`.
- **Dependencies**: none beyond what is already installed.
- **Out of scope**: no lease/tenant logic, no invoices or billing calculations, no S3 — those belong to later changes per the roadmap.
