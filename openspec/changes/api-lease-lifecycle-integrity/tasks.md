# Tasks

## 1. Check what is already recorded

- [x] 1.1 Query for rooms that already hold overlapping leases. The check governs creation only, so any existing overlap survives — confirm how many there are rather than assuming none, and record the number. **Result: 0 overlapping pairs** (0 leases, 0 rooms) — nothing to repair.

## 2. Refuse an overlapping start date

- [x] 2.1 In lease creation, after the existing open-lease guard, find the greatest `moveOutDate` among the room's leases and reject a start date earlier than it.
- [x] 2.2 Use the greatest ending date, not the most recently created lease — a lease entered out of order must not become the boundary.
- [x] 2.3 Accept a start date equal to that boundary. Ending dates are exclusive, so equality is exactly adjacent; rejecting it would leave a day billed to nobody.
- [x] 2.4 Leave the room's first lease unconstrained — there is nothing to overlap.
- [x] 2.5 Write a message that names the earliest date the owner may use, so they can pick a valid one rather than guessing.
- [x] 2.6 Keep the existing open-lease guard first, so a room with a running lease reports the reason that is actually actionable.

## 3. Filter leases whose term has run out

- [x] 3.1 Add the filter to the list query schema, as an optional flag alongside the existing ones.
- [x] 3.2 Express it as no move-out recorded **and** the term already past. A closed lease needs no attention and must not appear.
- [x] 3.3 Compute the term end in the query rather than storing it, matching what `addMonths` produces — including how it clamps a month-end start. **Verified before writing the filter**: JS `addMonths` and SQL `+ interval` agree on all eight cases tried, including 31 Jan + 1 month → 28 Feb and the leap-year 2024 case.
- [x] 3.4 Confirm it combines with the room and occupant filters, and that paging describes the filtered set.
- [x] 3.5 Run `tsc --noEmit`.

## 4. Verification against the running API

Failure paths included, not just the happy path.

- [x] 4.1 Seed a room whose lease has recorded a move-out, to create a boundary to test against.
- [x] 4.2 **A lease starting before that move-out returns 409 and creates nothing** — the double-billing this exists to prevent.
- [x] 4.3 **A lease starting on exactly that move-out date is accepted**, and billing the shared month shows the two tenancies covering it with no day billed twice and none skipped. Check the figures, not only the status codes.
- [x] 4.4 A lease starting well after the previous one ended is accepted.
- [x] 4.5 A lease starting partway through a month, clear of any previous tenancy, is accepted.
- [x] 4.6 A room's first lease is accepted whatever its start date.
- [x] 4.7 With a room let several times, a start date before the latest ending is refused even when it falls after an earlier one — confirming the boundary is the greatest end, not any end.
- [x] 4.8 A room with an open lease still reports the open-lease conflict, not the overlap one.
- [x] 4.9 The refusal message names a date the owner can actually use.
- [x] 4.10 A lease whose term ended with no move-out appears in the overdue filter.
- [x] 4.11 A lease still inside its term does not appear.
- [x] 4.12 A lease whose term ended but which recorded a move-out does not appear.
- [x] 4.13 **A lease beginning 2026-01-31 for one month** is judged against 2026-02-28, matching `addMonths` — the month-end case where the query's arithmetic and the mapper's could diverge.
- [x] 4.14 The overdue filter combined with a room filter returns only that room's overdue leases, and paging reports totals for the filtered set.
- [x] 4.15 Confirm the existing filters and the rest of lease creation are unaffected.
- [x] 4.16 Remove the verification data, leaving the database as it was found.
