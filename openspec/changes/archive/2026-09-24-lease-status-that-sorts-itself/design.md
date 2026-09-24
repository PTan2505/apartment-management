## Context

`status` is derived in the mapper from two columns: `cancelledAt` → cancelled, `moveOutDate` → finalized, otherwise active. The expected end is `startDate + durationMonths`, computed in the same place and stored nowhere.

The listing orders `startDate DESC, createdAt DESC` and offers `active` (a boolean) and `overdue` (a boolean that runs its own raw query for ids, because the term end is not a column).

## Goals / Non-Goals

**Goals.** Six states on the row. An order that puts the pressing ones at the top. Two counts.

**Non-Goals.** No stored status column. No reminders, no email, no "renew now" action beyond the ones that exist. No per-owner threshold for "due soon" — one number, stated.

## Decisions

### Six states, still derived

The two-week window is a constant, named once and used by both the mapper and the ordering so they cannot disagree about which tenancy is due soon.

A stored status would be a second place for a fact the dates already carry, and worse than the usual duplication: every one of these states is a question about TODAY. `active` becomes `dueSoon` and then `overdue` with no row being written. A stored column would be wrong every morning until something touched it.

### The order is computed where the rows are

Prisma cannot order by a rank over derived states, nor by `startDate + durationMonths`. Neither can be expressed as `orderBy` on columns.

So the listing does its filtering through Prisma as it does today, and hands the matching ids to one SQL query that ranks and pages them. Prisma keeps the filters — where the building, room and occupant joins already live and are already right — and SQL does the arithmetic and the ranking, which is the part it can do and Prisma cannot.

The cost is fetching the matching ids before paging them. At this system's size — a landlord with tens of buildings — that is a list of integers, and the alternative is duplicating every filter into SQL where the two copies would drift.

### Why the first three groups share one sort key

Overdue, due-soon and running are one sequence by end date: an overdue tenancy ended before today, a due-soon one ends within two weeks, a running one later. Sorting those three by end date ascending produces exactly the required order, with "least time left first" inside each group falling out of the same key.

So the rank distinguishes only four things — that sequence, upcoming, finalized, cancelled — and the end date does the rest. A rank per state with its own sort key per state would express the same order with more moving parts.

### Counts are the listing, asked twice

Each count is the listing with a status filter and `pageSize=1`, read off `meta.total`. No counting endpoint: the number must agree with what the list shows when the owner clicks through to it, and the surest way to agree with a query is to be that query.

### The switch goes

"Cần xử lý" answered "which tenancies ran out" with a control that existed nowhere else in the filter row. Its question is now a status value, which also puts the answer ON the row rather than only in a filtered view.

## Risks / Trade-offs

**Two weeks is a guess dressed as a rule.** It is stated in the spec and defined once in code. If it turns out to be wrong it is one constant, and the states around it do not change.

**The order is no longer chronological.** An owner reading the list as a history of signings will find it reordered. That is the point — the screen is for acting, not for browsing — and the signing order still decides within each group.

**Ids before paging.** Fetching every matching id would matter at a hundred thousand tenancies. This system will not have them, and the day it does, the filters move into SQL beside the ranking.
