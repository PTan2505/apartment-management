## Context

See proposal.md — Why.

The revenue report is assembled in `backend/src/modules/reports/`. It groups invoices by the month they were issued and by building, sums them, joins expenses grouped by the month they were incurred, and returns a nested `{ buildings: [{ months: [...], total }], total }`.

Two properties of the existing report constrain everything here:

- **Figures are keyed on the month an invoice was ISSUED**, except `received`, which is keyed on the day money arrived. The report has one requirement devoted to keeping those apart, and the frontend has a whole screen designed around it.
- **`billed = settled + outstanding` exactly.** That identity is the reader's only way to check the report against itself, and it holds today at every level.

## Goals / Non-Goals

Adding detail beneath the existing figures, and the counts behind them, without disturbing either property above. Not: freshness, export, contract-file metadata, or the lease's own agreement terms — each named in the proposal with its reason.

## Decisions

### Room detail is keyed exactly as the month it sits under

The obvious implementation — list the invoices for the building and month — produces a different figure from the one above it the moment a lease has more than one invoice in a month, or an invoice is voided, or an ad-hoc charge is issued mid-month. Those are not edge cases; the seed data has all three.

So the room rows come from the SAME query that produces the month totals, grouped one level finer, rather than from a second query written to look similar. The spec's "the detail sums to the total" scenario is the guard, and it is a real test rather than a restatement: a second query would pass it only by accident.

### `received` is NOT broken down per room

It could be, and it should not be. The cash figure is keyed on the day money arrived; a room row keyed on the month billed cannot carry it without the two keyings meeting inside a single row — which is precisely the confusion the existing requirement exists to prevent, reproduced at a finer grain where it is harder to see.

If a per-room cash figure is wanted later it needs its own shape, stated as cash, and not a column in an accrual table.

### Detail is opt-in, via a query parameter

`?detail=rooms` (or equivalent) rather than a separate endpoint. A separate endpoint would repeat the whole range-and-building query surface, and the two would drift; the caller wanting both would make two requests that could disagree if an invoice were issued between them.

Default off. The screens that exist today ask for totals, and none of them should start paying for a room list on the strength of a deployment.

### Counts come from the same grouping, not from a second count query

`SELECT COUNT(*)` beside `SELECT SUM(...)` over a different WHERE clause is how a count and a total come to disagree. The counts fall out of the same grouped rows the sums do.

The one that needs care is "rooms covered": a room with a tenancy but no invoice in the month must count, or the count says fewer rooms are let than are. That is why the spec requires such a room to be reported with zeroes rather than omitted — the count and the row list are the same fact stated twice, and they have to be produced together.

## Risks / Trade-offs

- **Response size.** A year across several buildings with every room is large. → Opt-in, so the cost is paid by the caller that asked. If it becomes a problem the range is already bounded and the natural next step is a per-month request, not pagination of a nested shape.
- **The detail and the totals drifting apart.** This is the failure that matters: a breakdown that does not sum to its own total discredits the total. → One query, grouped twice; and the summation is a spec scenario, so it is a test rather than an intention.
- **A caller reading the room count as "rooms in the building".** It is rooms the report covers — tenanted in that month — which is smaller. → The spec names it as rooms the figures cover, and the count sits with the figures rather than with the building.

## Migration Plan

Additive. Existing callers receive the same shape plus counts they can ignore; room detail appears only when asked for. No migration, no data change.

## Open Questions

None that change this design. The exact query-parameter spelling is an implementation detail for the apply pass to settle against the module's existing conventions.
