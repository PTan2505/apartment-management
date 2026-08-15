## Context

`api-billing-operations` gave each lease its own `startMeterReading` and `endMeterReading`, and made a lease's invoices chain from its own opening reading rather than the room's history. That solved attribution *within* a tenancy but left the gap *between* tenancies unrecorded — the meter advances while a room is empty, and nobody is charged. See proposal.md for motivation.

Decisions locked before this design (from prior exploration, not reopened here): a vacant room's electricity always belongs to the owner; it is reconciled at every month end the room stands empty and once more when the next lease begins; categories are a fixed enum; expenses are hard-deleted; an expense may carry the quantity and rate it was computed from.

## Goals / Non-Goals

**Goals:**
- Capture every kWh a room consumes while empty, attributed to the month it was reconciled in.
- Give manual costs — cleaning, repairs, fees — the same shape as generated ones, so reporting reads one table.
- Keep the room's meter history unbroken across the boundary between tenancies.

**Non-Goals:**
- No revenue aggregation. The `net = collected − expenses` figure these records enable belongs to `api-revenue-reports`.
- No owner-definable categories. A fixed enum plus a free-text description covers the tail, and makes grouping in reports possible without a join.
- No automatic detection of vacant rooms needing a month-end reading. The owner walks the building; the API records what they read. A "rooms awaiting a vacancy reading" view is a reporting concern.
- No proration or apportionment of a vacancy across the months it spanned — see the risk below.

## Decisions

**A room's meter history spans three sources**: `Lease.startMeterReading`, `Lease.endMeterReading`, and a vacancy expense's closing reading. "The room's latest known reading" is the most recent of these by date, and it is what both a vacancy reading and a new lease's default opening reading resolve against. This is the piece that keeps the meter chain unbroken across a tenancy boundary — without vacancy readings in the lookup, a new lease would default to the previous lease's closing reading and re-charge the incoming tenant for consumption the owner already paid for.

This changes an existing implementation detail: `resolveStartMeterReading` currently returns immediately when the owner supplies a reading, so it never fetches the previous closing value. That early return has to go, because the supplied-reading case is exactly the one that produces an expense — the gap can only be computed by comparing against what came before.

**Two triggers, one record type**: month-end reconciliation and lease creation both produce a `vacancy_electricity` expense, differing only in their date and in the `reconciliation` value recording which produced them. Alternative considered: making the lease-creation catch-all a distinct category so the two are separable in reports. Rejected because they are the same cost for the same reason — the owner paid for electricity in an empty room — and splitting them would make "total vacancy cost" a two-category sum for no benefit.

The two cannot collide: a lease starting mid-month leaves the room occupied at that month's end, so no month-end trigger fires for it.

**Idempotency uses a partial unique index keyed on an explicit trigger column**: `(roomId, year, month) WHERE category = 'vacancy_electricity' AND reconciliation = 'month_end'`. Every vacancy record carries `year` and `month`; a `reconciliation` column records which trigger produced it, `month_end` or `lease_start`. This follows the partial-index pattern used for room codes, active leases, primary occupants, and live invoices.

Two predicates, each doing distinct work. The category predicate confines the constraint to vacancy records, so a room can still be cleaned or repaired several times in one month while its meter can be read only once per month end. The reconciliation predicate excludes turnover records, because a room can change hands more than once in a month — a tenancy ending on the 3rd and another on the 20th produce two legitimate reconciliations — whereas a month end occurs exactly once.

Alternative considered: leaving `year` and `month` null on turnover records and keying the index on `year IS NOT NULL`. Rejected on two counts. It relies on Postgres treating each NULL as distinct in a unique index, which is true but is an implicit mechanism doing load-bearing work, and it would silently start rejecting legitimate records if anyone later added `NULLS NOT DISTINCT`. It also leaves two nullable columns whose meaning depends on a sibling column's value, which is harder to read than naming the trigger outright.

Alternative also considered: one accumulating row per room-month, updated rather than appended. Rejected because it breaks the invariant that `quantity = currentReading − previousReading`. When a room is occupied between two vacancies in the same month, the span between the row's first and last readings includes consumption a tenant was billed for, so the accumulated quantity no longer matches its own readings. Keeping one row per reconciliation event means every row remains self-auditing, and a month's total is a sum — which reporting performs across categories regardless.

**Amount is computed when quantity and rate are present**: a caller supplying both gets `round(quantity × rate)` regardless of any amount they send. Storing an independently-supplied amount alongside the figures it claims to derive from invites the two to disagree after an edit, which is exactly the drift the invoice snapshot design set out to avoid. A flat cost supplies an amount directly and leaves both columns null, so cleaning needs no invented quantity.

**Expenses are hard-deleted, unlike invoices**: this is a deliberate asymmetry. An invoice is issued to a tenant, so the record of what was charged must survive a correction — hence `voidedAt`. An expense is an internal note nobody receives; a mistyped one is noise, and keeping it would only complicate every total with a filter. Recording the reasoning here so the inconsistency reads as a decision rather than an oversight.

**The lease and its vacancy expense are written in one transaction**: a lease that succeeded while its expense failed would silently lose a cost the owner has no way to notice. Wrapping both means a failure leaves nothing behind.

**`incurredAt` differs by trigger**: month-end records are dated the last day of that month, matching when the owner settles with the electricity company. Lease-creation records are dated the lease's start date, which is when that reconciliation happened. Both are unambiguous single rules.

## Risks / Trade-offs

- [A long vacancy whose month ends were never recorded dumps the whole gap into the month the next lease starts] → the month-end trigger exists precisely to avoid this, and the catch-all keeps the cost from vanishing entirely; the record is editable if the owner wants it moved. Splitting it across the months it spanned is impossible without readings from inside the vacancy.
- [The owner must remember to read vacant rooms at month end] → nothing enforces it, and a missed month is silently absorbed into the next reconciliation rather than reported. A "rooms awaiting a vacancy reading" view would close this and belongs with reporting.
- [Hard delete means a mistakenly removed expense is unrecoverable] → accepted; expenses are cheap to re-enter and are not issued to anyone, unlike invoices.
- [Changing the lease opening-reading default alters behaviour for rooms with vacancy readings] → intended and captured as a MODIFIED spec delta; no production data exists.
- [A vacancy reading and an invoice can both exist for one room-month] → correct rather than a conflict, and asserted in the spec so nobody later "fixes" it by adding a constraint.

## Migration Plan

Adds an `Expense` table with its partial unique index and two enums. No changes to existing tables and no backfill — no leases or invoices exist yet, so no room has vacancy history to reconstruct. Deploy: `prisma migrate deploy`, then restart. Rollback: revert the migration together with the leases-service change, since the opening-reading default would otherwise query a table that no longer exists.
