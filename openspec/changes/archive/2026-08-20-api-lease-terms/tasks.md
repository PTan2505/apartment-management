# Tasks

## 1. Pre-migration check

- [x] 1.1 Count existing leases and record it. The backfill sets every one of them to a zero deposit, and that is only acceptable while the number is small enough to correct by hand if it is not.

## 2. Schema and migration

- [x] 2.1 Add `baseRent` to `Lease` in `schema.prisma`, matching the precision `Room.baseRent` uses so a copy cannot lose or gain digits.
- [x] 2.2 Add `depositMonths` to `Lease` as a non-negative integer, with a comment saying it is months rather than currency and why.
- [x] 2.3 Write the migration as add-nullable → backfill → set NOT NULL. A single `ADD COLUMN … NOT NULL` cannot work on a table with rows.
- [x] 2.4 Backfill `baseRent` from each lease's room, which reproduces exactly what billing used for those leases before this change.
- [x] 2.5 Backfill `depositMonths` to zero, with a comment recording that this asserts nothing — the information was never captured, and any other value would be invented.
- [x] 2.6 Apply the migration and confirm no lease is left with a null or zero `baseRent` that had a non-zero room rent.
- [x] 2.7 Run `prisma generate`. The generated client is stale at runtime after a schema change even when `tsc` passes — this bit the previous change.

## 3. Lease creation

- [x] 3.1 Add `baseRent` (optional) and `depositMonths` (required, non-negative) to the create-lease schema.
- [x] 3.2 Resolve the rent in the service: use the supplied value, else the room's current base rent. Mirror how `resolveStartMeterReading` is written rather than inventing a second shape.
- [x] 3.3 Write both onto the lease inside the existing transaction, so a lease still never exists without its terms or its primary occupant.
- [x] 3.4 Reject a negative rent and a negative deposit with 400.

## 4. Reporting

- [x] 4.1 Include `baseRent` and `depositMonths` wherever a lease is returned.
- [x] 4.2 Report a derived `depositAmount` alongside them, computed from the lease's own rent. Do not store it.
- [x] 4.3 Confirm the derived amount is applied at every site a lease is returned — list, single retrieve, create, update, move-out — the way the room capability had to apply its building selection to all six of its return sites.

## 5. Billing source

- [x] 5.1 Change invoice generation to copy the rent from the lease rather than from the lease's room.
- [x] 5.2 Confirm nothing else in invoicing still reads the room's rent.
- [x] 5.3 Run `tsc --noEmit`.

## 6. Verification against the running API

Failure paths included, not just the happy path.

- [x] 6.1 Creating a lease without an agreed rent records the room's current base rent.
- [x] 6.2 Creating a lease with an agreed rent different from the room's records the supplied one, and leaves the room's base rent unchanged.
- [x] 6.3 A negative agreed rent returns 400 and creates nothing.
- [x] 6.4 Omitting the deposit returns 400 and creates nothing — the case that distinguishes "no deposit" from "not recorded".
- [x] 6.5 A negative deposit returns 400 and creates nothing.
- [x] 6.6 A deposit of zero is accepted and recorded as zero.
- [x] 6.7 A lease with rent 3,000,000 and a two-month deposit reports a deposit amount of 6,000,000.
- [x] 6.8 Changing the room's base rent afterwards leaves that lease's rent and deposit amount unchanged — the behaviour change this exists for.
- [x] 6.9 An invoice generated after that room-rent change charges the lease's agreed rent, not the room's new one.
- [x] 6.10 An invoice issued before the room-rent change still reports what it always did.
- [x] 6.11 A lease created after the room-rent change, without an agreed rent, picks up the new rent.
- [x] 6.12 Every endpoint returning a lease reports rent, deposit months, and deposit amount consistently.
- [x] 6.13 Remove the verification data, leaving the database as it was found.
