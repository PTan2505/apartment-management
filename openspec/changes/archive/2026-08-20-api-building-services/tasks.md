# Tasks

## 1. Schema and migration

- [x] 1.1 Add `BuildingServiceFee` to `schema.prisma`: building, name, unit amount (same precision as other configured rates), `isActive`, timestamps.
- [x] 1.2 Add `LeaseServiceFee`: lease, the building fee it came from, the `unitAmount` copied at selection, `quantity`, timestamps. Comment why the amount is a copy rather than a lookup.
- [x] 1.3 Add the partial unique index for fee name per building among offered fees, following `Room.roomCode`'s shape. Prisma cannot express a partial unique index, so it goes in the migration by hand.
- [x] 1.4 Add the unique index preventing a lease selecting the same fee twice.
- [x] 1.5 Apply the migration. Both tables are new, so there is nothing to backfill and no existing row to preserve.
- [x] 1.6 Run `prisma generate` — the runtime client is stale after a schema change even when `tsc` passes.

## 2. Building fee module

- [x] 2.1 Create `modules/service-fees/` with `router.ts`, `controller.ts`, `service.ts`, `schema.ts`, following the module convention.
- [x] 2.2 Add create and list, scoped to a building. List is paginated with the shared contract.
- [x] 2.3 Add update (name and unit amount).
- [x] 2.4 Add retire and restore. Restore is refused when the name has since been taken by an offered fee.
- [x] 2.5 Reject an empty name, a negative unit amount, and a duplicate name among offered fees. Accept zero.
- [x] 2.6 Register the router, keeping any literal path segment above `/:id` — Express matches in registration order, as the buildings router comments.

## 3. Lease selections

- [x] 3.1 Add lease-scoped endpoints for listing, adding, changing quantity, and removing, mirroring how occupants hang off a lease.
- [x] 3.2 On add, copy the building fee's current unit amount onto the row. Read it once, at that moment.
- [x] 3.3 Default the quantity to one when not supplied.
- [x] 3.4 On a quantity change, write the quantity only. Do not re-read the building fee — this is the specific failure the design names, where a tenant's existing bike silently reprices because they bought a second one.
- [x] 3.5 Reject selecting a fee from another building, a retired fee, a duplicate selection, and a quantity below one.
- [x] 3.6 Report a derived monthly amount from the agreed unit amount and quantity. Do not store it.
- [x] 3.7 Run `tsc --noEmit`.

## 4. Verification against the running API

Failure paths included, not just the happy path.

- [x] 4.1 Seed a building, a room, a customer, and a lease to verify against.
- [x] 4.2 Adding a fee with a name and amount returns 201; listing the building's fees returns it.
- [x] 4.3 A fee at zero is accepted; a negative amount and an empty name are both rejected with 400.
- [x] 4.4 A duplicate name in the same building returns 409; the same name in another building is accepted.
- [x] 4.5 Retiring a fee removes it from what a lease may select, and selecting it then returns 400.
- [x] 4.6 Restoring works, and is refused with 409 when the name was taken meanwhile.
- [x] 4.7 Selecting a fee for a lease records the building fee's current amount and the supplied quantity.
- [x] 4.8 Omitting the quantity records one.
- [x] 4.9 A lease's fee reports a derived monthly amount equal to unit amount times quantity.
- [x] 4.10 **Reprice the building fee, then confirm the lease still reports the amount it agreed** — the behaviour this change exists for.
- [x] 4.11 A lease created and selecting that fee afterwards records the new amount.
- [x] 4.12 **Change the quantity after a reprice, and confirm the unit amount did not move** — the specific silent failure the design names. Check the unit amount, not only the total.
- [x] 4.13 Adding a fee to a running lease that never had it records the current amount, not any historical one.
- [x] 4.14 Removing a fee from a lease leaves it no longer carrying that fee.
- [x] 4.15 Selecting the same fee twice returns 409; a fee from another building returns 400; a quantity below one returns 400 and leaves any existing quantity unchanged.
- [x] 4.16 **Retiring a fee an active lease already selected leaves that lease carrying it at its agreed amount** — the problem the copying decision removes.
- [x] 4.17 An unauthenticated request returns 401.
- [x] 4.18 Confirm no invoice, lease, or report response changed as a result of this work — nothing should consume these tables yet.
- [x] 4.19 Remove the verification data, leaving the database as it was found.
