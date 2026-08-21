## Context

See proposal.md — Why. What shapes the approach, checked rather than assumed:

- Lease creation's only room-level guard is `findFirst({ roomId, moveOutDate: null })`. It asks whether an *open* lease exists and never looks at dates.
- An ending date is now exclusive across the system: the last day covered is the day before `moveOutDate ?? expectedEndDate`. That decision is what makes "may begin on exactly the date the previous one ended" precise rather than approximate.
- `expectedEndDate` is not stored. It is `addMonths(startDate, durationMonths)`, computed in the lease mapper, so filtering on it cannot be a plain column comparison.
- Listing already filters by room, by occupant, and by active status, and is paginated through the shared helper.

## Goals / Non-Goals

**Goals:**

- Make it impossible to create a lease that would have two tenancies billed for the same days.
- Make a lease that has stopped working findable by the person who has to fix it.

**Non-Goals:**

- Repairing overlaps already recorded. The check governs creation.
- Constraining the start date in any other way — no month boundaries, no minimum gap.
- A frontend for the filter.
- Anything about billing. Neither half touches an invoice.

## Decisions

### The check compares against the room's most recent tenancy, not all of them

A room's leases cannot overlap each other once this rule holds, so the latest one's end is the only boundary that matters: any start date at or after it is clear of every earlier lease too.

Checking against all leases would be equivalent and slower, and would suggest to a reader that arbitrary overlaps are possible — which they are not, once the rule is in place going forward.

The one case this leaves is a room that already contains overlapping leases from before the rule. There, "most recent" is still the right boundary: it is the latest end recorded, so a new lease clearing it clears everything.

### "Most recent" means the latest ending, not the latest created

Ordering by creation would let a lease entered out of order become the boundary. The comparison is against the greatest `moveOutDate` on the room, because that is the day after which the room is genuinely free.

An open lease has no `moveOutDate` at all, and is already refused by the existing guard before this check is reached — so the two guards compose rather than overlap.

### A start date equal to the previous end is accepted

This follows from ending dates being exclusive, and is the whole point of having made them so. A tenancy ending 10 May covers through 9 May; a lease beginning 10 May takes the room from there. Verified previously as `05-01…05-09` plus `05-10…05-31` summing to exactly one month's rent.

Rejecting equality would force every renewal to start a day late and leave that day billed to nobody.

### The overdue filter is computed, not stored

`expectedEndDate` is derived, so there is no column to compare. The filter is therefore expressed as `startDate + durationMonths <= today`, which the database can evaluate without the value being materialised.

**Alternative considered:** storing `expectedEndDate` as a column to filter on directly. Rejected for the reason the lease capability already gives for keeping it derived — a stored copy can contradict the start date and duration it comes from, and this change would be adding that risk purely to simplify one query.

The consequence is that the filter must express the same arithmetic the mapper does, including how `addMonths` clamps a month-end start. That duplication is worth naming: it is the price of not storing the value, and the verification checks a month-end case specifically because it is where the two could diverge.

### Overdue means "term ended and still open", not "term ended"

A lease whose term ended and which has recorded a move-out is finished; it needs nothing. Including it would fill the filter with history and make it useless for the purpose it exists for.

So the filter is the conjunction: no move-out recorded, and the term already past.

## Risks / Trade-offs

- **The overdue filter duplicates the expected-end arithmetic.** The mapper computes it in JavaScript with `addMonths`; the filter must compute it in the query. They can drift — particularly on a month-end start, where `addMonths` clamps 31 January + 1 month to 28 February. → Named here rather than discovered later, and the verification includes a month-end lease specifically to catch a divergence.

- **Rooms that already hold overlapping leases stay overlapping.** → Deliberate: the rule governs creation, and rewriting recorded history is a data decision rather than a rule one. The development database holds none, so there is nothing to repair today — worth confirming rather than assuming before the change lands.

- **A new lease is refused where it was previously accepted.** An owner entering a renewal that starts before the previous move-out now gets a 409. → That is the correction; it was producing invoices charging the same days twice. The message should say what the boundary is, so the owner can pick a valid date rather than guessing.

- **The two guards can both fire for one attempt.** A room with an open lease also has no end date to compare. → The existing open-lease guard runs first and returns its own conflict, so the owner sees the reason that is actually actionable.
