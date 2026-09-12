## Why

A person can be recorded as currently living in more than one room at once. Signing a tenancy for somebody who already occupies a room is accepted, and so is adding them as an occupant of a second one. Reproduced against the running API: one customer ended up holding three rooms simultaneously.

Nothing downstream is built for that. Occupant counts drive the electricity and water split, so a person counted in two rooms is billed twice for utilities they used once. The revenue report names "the person responsible" for a room and would name the same person for two. And it is not a state the owner can see is wrong — each room's screen looks perfectly ordinary on its own.

The guard that should have caught it looks only inside the lease being edited: "is this person already an occupant **of this lease**". It is the right question asked of too small a set.

## What Changes

- Signing a tenancy refuses a signatory who currently occupies another room.
- Adding an occupant refuses somebody who currently occupies another room.
- Both refusals name the room the person is already in, because the owner's next action is to end that tenancy and they should not have to go looking for it.

## Deliberately not built

**A database constraint.** The rule cannot be expressed as a partial unique index on `leftAt IS NULL`: cancelling a tenancy does not set `leftAt`, so its occupant rows keep a null there forever, and an index would block a person whose previous tenancy never happened. The predicate has to read through to whether the lease still holds its room.

**Moving a person between rooms in one step.** Ending one tenancy and starting another is the existing way, and it is the one that gets the dates and the final bill right. This change makes the wrong order refuse rather than silently produce two occupancies.

**Retroactive cleanup.** Rooms already double-occupied in a database are not repaired here. The rule stops new ones; existing ones are the owner's to resolve, and a script that guesses which room somebody really lives in would be guessing.

## Capabilities

### Modified Capabilities

- `lease`: a person holds at most one room at a time.

## Impact

- `backend/src/modules/leases/` — the occupancy predicate, the signing guard, the add-occupant guard.
- Two new error codes, so the frontend needs its generated code list regenerated.
- No migration.
