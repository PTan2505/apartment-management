## Context

`HOLDS_ITS_ROOM` in `leases/occupancy.ts` already defines when a tenancy still holds its room, and carries a comment about the danger of that predicate being scattered. This change adds the second half of the same idea — when a PERSON still holds a room — and puts it in the same file for the same reason.

The existing guard in `addOccupant` reads `lease.occupants`, the occupants of the lease being edited. `createLease` checks that the signatory exists and has a phone, and checks that the ROOM is free, but never asks whether the PERSON is.

## Goals / Non-Goals

**Goals.** One place that answers "which room is this person in". Both doors closed. A refusal that names the room.

**Non-Goals.** No database constraint, no migration, no repair of existing data, no new endpoint for moving somebody between rooms.

## Decisions

**The predicate reads through the lease, not the occupancy row.** `leftAt IS NULL` alone is wrong: `cancelLease` does not set a departure date on occupants, so a cancelled tenancy's rows keep a null there forever. Judging occupancy from that column alone would refuse somebody whose previous tenancy never happened — and it would do it citing a room they were never in. The query is `leaseOccupant where leftAt is null AND lease matches HOLDS_ITS_ROOM`.

**That is also why this is not a partial unique index.** An index can only see the occupancy row's own columns, so it cannot express "and the lease still holds its room". The application is the only place the rule can be stated correctly, which is worth writing down given `occupancy.ts` says the opposite about the room rule — that one IS enforced by an index, and the difference is exactly this.

**Two error codes, not one.** `SIGNATORY_ALREADY_HOUSED` and `OCCUPANT_ALREADY_HOUSED`. The owner is doing two different things and can take two different actions, and the existing codes distinguish the same two roles elsewhere (`SIGNATORY_NOT_FOUND` beside `CUSTOMER_NOT_FOUND`).

**The check runs inside `createLease`'s transaction, before anything is written.** Outside it, a lease could be signed between the check and the write. It is not a full defence — nothing serialises two concurrent signings without a constraint — but it narrows the window to the transaction rather than the request.

**`extendLease` is left alone.** It closes the predecessor's occupants before creating the successor's, in the same transaction, so a person carried forward is not a current occupant at the moment their new row is written. Verified rather than assumed.

## Risks / Trade-offs

**A room-to-room move now needs the old tenancy ended first.** That was already the only way to get the dates and the final bill right; the difference is that the wrong order now refuses instead of quietly producing two occupancies.

**Rooms already double-occupied stay that way.** The rule is not retroactive. A repair script would have to guess which room somebody really lives in, and a wrong guess moves a person's billing without anybody asking.

**Two concurrent signings for the same person can still both pass.** Both would read the state before either writes. The room rule has an index behind it; this one does not, for the reason above. Narrowed, not closed.
