## Context

`api-auth-module` shipped `User`/`RefreshToken`, the `authenticate` middleware (verifies a Bearer JWT and attaches `req.user = { userId, role }`), and typed `AppError` subclasses handled by centralized error middleware. No domain routes consume `authenticate` yet — this change is the first. See proposal.md for motivation.

Decisions locked before this design (from prior exploration, not reopened here): water is billed per person, not per m³; no `occupancyStatus` on `Room` (derivable from leases later); no meter-reading field on `Room` (each invoice will carry its own previous/current readings); soft delete via `isActive` on both models; room codes unique among active rooms only, reusable after retirement; one change covering both capabilities.

## Goals / Non-Goals

**Goals:**
- Model `Building` and `Room` with the minimum fields later changes actually need.
- Establish `requireRole` as the reusable authorization layer every later domain module will apply.
- Enforce the active-scoped room-code uniqueness rule at the database level, not only in application code.

**Non-Goals:**
- No deactivation guards based on lease state — `Lease` does not exist yet; `api-lease-management` adds them as spec modifications.
- No per-owner scoping of buildings (e.g. "owner A sees only their buildings") — v1 has a single owner with unrestricted access, per the auth design.
- No pagination on list endpoints — expected data volume is a handful of buildings and low hundreds of rooms; adding it now would be speculative.

## Decisions

**Money and rate columns use `Decimal`, not `Float`**: `electricityRate`, `waterRatePerPerson`, and `baseRent` are all monetary. Prisma's `Decimal` (Postgres `NUMERIC`) avoids the binary floating-point rounding errors that would otherwise accumulate through the billing multiplications in `api-billing-operations`. Alternative considered: storing integer minor units (e.g. cents) — rejected because per-kWh rates are commonly fractional beyond two decimal places, so a fixed minor-unit scale would itself lose precision.

**Active-scoped uniqueness needs a partial index**: the rule "room code unique among *active* rooms in a building" cannot be expressed with Prisma's `@@unique([buildingId, roomCode])`, which would wrongly block reuse after retirement. The migration adds a raw partial index instead: `CREATE UNIQUE INDEX ... ON "Room" ("buildingId", "roomCode") WHERE "isActive" = true`. This is added by hand-editing the generated migration SQL. The service layer also checks for duplicates before writing, so the common case returns a clean `ConflictError` rather than surfacing a raw database constraint violation — the index is the correctness backstop against races, not the primary user-facing check.

**`requireRole` is a middleware factory**: `requireRole("owner")` returns a middleware that reads `req.user` (already populated by `authenticate`) and throws `ForbiddenError` when the role does not match. It must always be mounted *after* `authenticate`; on its own it would see no `req.user` and reject everything. Alternative considered: folding the role check into `authenticate` via a parameter — rejected because it conflates authentication (who are you) with authorization (what may you do), and later changes may need routes that authenticate without requiring a specific role.

**`ForbiddenError` (403) is a new error class**: `lib/errors.ts` currently has no 403. Authenticated-but-wrong-role must be distinguishable from unauthenticated (401), per the specs. Added alongside the existing `AppError` subclasses so the centralized handler maps it automatically.

**Retire/restore are dedicated endpoints, not a PATCH field**: retiring is modelled as `POST /buildings/:id/retire` and `POST /buildings/:id/restore` (same shape for rooms) rather than exposing `isActive` in the generic update payload. This keeps state transitions explicit and gives `api-lease-management` a single obvious place to add the "cannot retire while occupied" guard, instead of burying that rule inside a general-purpose update handler.

**Restore revalidates room-code uniqueness**: because retirement frees a code for reuse, restoring a room can collide with a newer active room holding that code. Restore therefore re-runs the duplicate check and fails with `ConflictError` rather than violating the partial index. This is the one non-obvious consequence of the reuse rule and is specified explicitly.

**List filtering via an explicit query flag**: list endpoints default to active-only and accept something like `?includeInactive=true` to widen the result. Defaulting to active-only matches the common case (managing current properties) and means a caller cannot accidentally act on retired records they did not expect to see.

## Risks / Trade-offs

- [Hand-edited partial index could be lost if someone regenerates the migration] → the room-code reuse scenarios in the spec cover this behaviorally, so a regression surfaces in verification rather than silently.
- [Prisma `Decimal` values serialize as strings in JSON, which frontend code must handle] → acceptable and correct (it preserves precision); worth noting for whoever builds the frontend rather than silently coercing to a float at the API boundary.
- [Retiring a building leaves its rooms active, which may read as surprising] → deliberate per prior discussion: building retirement and room retirement are independent events. Documented in the building spec so the behavior is explicit rather than incidental.
- [No lease-based deactivation guard yet means an owner can retire a room that will later hold a lease] → unavoidable ordering constraint; `api-lease-management` closes this gap and the proposal calls it out so it is not mistaken for an oversight.

## Migration Plan

Adds `Building` and `Room` tables plus the partial unique index. Deploy: run `prisma migrate deploy`, then restart the API. No existing data to migrate — both tables start empty, and no prior change references them. Rollback: revert the migration; the only dependency is this change's own routes, so nothing else breaks.
