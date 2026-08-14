## Context

`api-property-room` shipped `Building` and `Room` with soft delete, the `requireRole("owner")` guard, and a partial unique index pattern for active-scoped uniqueness. `api-auth-module` shipped `User` with a `customer` role that nothing has created yet. See proposal.md for motivation.

Decisions locked before this design (from prior exploration, not reopened here): expected end date, lease status, occupant status, and the lease's tenant are all derived rather than stored; `Lease.occupantCount` stays manual and authoritative for billing; a customer whose phone already exists is reused rather than duplicated; `User.phone` becomes optional; contract upload to S3 is split into a separate `api-lease-contracts` change.

## Goals / Non-Goals

**Goals:**
- Model `Lease` and `LeaseOccupant`, enforcing one active lease per room and one active primary occupant per lease at the database level, not only in service code.
- Keep one stable identity per person so an owner can follow someone moving between rooms.
- Close the retire-guard gap `api-property-room` deferred, at both the room and building level.

**Non-Goals:**
- No contract file handling — deferred to `api-lease-contracts`, and a lease is valid with no contract attached.
- No automatic lease expiry — nothing flips a lease to finalized when its expected end date passes. Move-out is always an explicit act by the owner, because the actual date matters for billing and rarely equals the projected one.
- No customer login — `customer` users still have no password, unchanged from `api-auth-module`.
- No proration or partial-month billing logic — that lives in `api-billing-operations`.
- No automatic reconciliation between `occupantCount` and recorded occupants — see the decision below; this is deliberate, not deferred.

## Decisions

**Being a tenant is a property of a relationship, not of a person**: `User.role` stays `owner | customer` and gains no `tenant`/`occupant` split. The same human can be the signatory on one lease and an ordinary occupant on another, simultaneously, and this year's occupant may sign their own lease next year. A role enum is identity-level and global, so encoding lease-specific responsibility there would be wrong the moment one person appears in two leases differently. Instead the `LeaseOccupant` row carries `isPrimary`. Alternative considered: a separate `tenant` role, or an `isTenant` flag on the user — both rejected for the same reason.

**`Lease` has no `tenantId` column**: the tenant is derived as the current primary occupant. Storing it as well would invite the two to disagree, and would destroy history in the case this change exists to support — when responsibility transfers mid-lease, mutating a `tenantId` erases who held it before, whereas closing one occupant row and opening another preserves the whole chain. The cost is that lease creation must write two rows atomically, so it runs in a transaction; a lease is never left without a primary occupant.

**Occupant status uses dates, not a boolean**: `LeaseOccupant` records `joinedAt` and a nullable `leftAt`; "still living there" is `leftAt IS NULL`. A boolean `isActive` would record *that* someone left but not *when*, which is useless for reconstructing who lived in a room during a given billing period. This mirrors `moveOutDate` on the lease and the derived-status pattern used throughout.

**Three partial unique indexes enforce the integrity rules**, following the pattern established in `api-property-room`:
- `UNIQUE ("roomId") WHERE "moveOutDate" IS NULL` on `Lease` — one active lease per room.
- `UNIQUE ("leaseId") WHERE "isPrimary" = true AND "leftAt" IS NULL` on `LeaseOccupant` — one primary at a time.
- `UNIQUE ("leaseId", "userId") WHERE "leftAt" IS NULL` on `LeaseOccupant` — a person is not a current occupant twice, while still allowing a re-add after departure.

In each case the service checks first so the common path returns a clean `ConflictError`; the index is the backstop against concurrent writes racing past that check. Note what the indexes cannot express: that a lease has *at least* one primary occupant. That is guaranteed by creating both rows in one transaction and by refusing to close the primary occupant while others remain.

**`occupantCount` is deliberately NOT derived from `LeaseOccupant`**: this breaks the pattern used for every other derived value in this change, and the divergence is intentional. Occupant records are an informational directory of people the owner has details for; `occupantCount` is the billing input. An owner may know five people live in a room while holding names for two. Deriving the count would silently reduce a tenant's water charge as a side effect of incomplete data entry — a data-quality gap turning into a billing error. The two numbers are allowed to disagree, and the specs assert that adding or removing an occupant leaves the count untouched. Anyone later tempted to "fix" the inconsistency should read this paragraph first.

**`User.phone` becomes nullable**: occupants such as children need a stable identity so the system can follow them between rooms, but have no phone. Postgres permits multiple NULLs under a unique index, so `phone` stays unique where present. Consequences: find-or-create dedupe only works for people with a phone, so re-registering the same phoneless person creates a second record — accepted, since name-based matching would be guesswork. Owner login is untouched, as owners always have a phone. Alternative considered: keeping occupant details inline on `LeaseOccupant` with no `User` row — rejected because it destroys the stable identity needed to track one person across rooms, which is the main thing this change adds.

**The lease signatory must have a phone**: a lease is a contract, so the person responsible for it has to be contactable. This is enforced at lease creation rather than by the customer model, which must stay permissive for occupants. *(Assumption, recorded rather than asked: it follows from the phone-nullable decision but was not separately confirmed.)*

**Derived fields are computed in a mapper, not stored**: a single `toLeaseResponse()` computes `expectedEndDate`, `status`, and the current tenant, and shapes every lease response. Centralising it means each value is computed one way in one place.

**Month arithmetic clamps to the end of the month**: `startDate + durationMonths` is ambiguous when the start day does not exist in the target month — 31 January plus one month has no 31 February. The system clamps to the last valid day (28 or 29 February). This matches lease convention and how date libraries' `addMonths` behaves; a naive day-arithmetic implementation would silently roll into March.

**The building retire guard queries through rooms**: retiring a building must reject when *any* room in it has an active lease, a join from `Building` → `Room` → `Lease`. The check lives in the buildings service, making buildings the first module to read across a domain boundary. It is a read-only existence check, so it stays a query rather than a service-to-service call.

**Move-out validation is bounded below but not above**: the move-out date must not precede the lease start date, but may precede the expected end date — leaving early is normal. There is deliberately no upper bound either: a move-out after the expected end date represents a tenant who overstayed, which is equally real.

**Move-out cascades to occupancy records**: finalizing a lease marks its current occupants as departed on the same date. Otherwise people would remain recorded as living in a room that is no longer let, and "where does this person live?" would return a stale answer.

## Risks / Trade-offs

- [`occupantCount` and recorded occupants drifting apart looks like a bug to a future reader] → documented as intentional in both the design and an explicit spec requirement asserting the two are independent, so the behavior is pinned by tests rather than resting on a comment.
- [Deriving `expectedEndDate` means it cannot be queried or sorted in SQL] → acceptable at this scale; if a future change needs "leases expiring this month" as a database query, that is the point to reconsider, and the rule lives in one function.
- [Phoneless customers cannot be deduplicated, so repeated entry creates duplicate people] → accepted; matching on name alone would silently merge distinct people, which is worse than a duplicate the owner can see and clean up.
- [Transferring the primary occupant is a two-row write that could leave a lease with none or two primaries if interrupted] → performed in a transaction and backed by the partial unique index, so a partial failure rolls back rather than persisting an invalid state.
- [The building retire guard's join gets slower as rooms and leases accumulate] → bounded by an indexed existence check that stops at the first hit; volume here is a handful of buildings and low hundreds of rooms.
- [Retire guards change existing behavior, so a previously valid retire call now fails] → no production data exists yet, and both affected requirements are updated as MODIFIED deltas so the change is explicit in the specs rather than silent.

## Migration Plan

Adds the `Lease` and `LeaseOccupant` tables with their partial unique indexes, and alters `User.phone` to be nullable. Widening a column to nullable is backward compatible and needs no data backfill; the only existing user is the seeded owner, who has a phone. Deploy: run `prisma migrate deploy`, then restart the API. Rollback: revert the migration together with the retire-guard changes, since those guards query the `Lease` table and would fail against a schema without it. Narrowing `phone` back to `NOT NULL` would fail if any phoneless customer has been created by then, so a rollback after real use would need those rows removed first.
