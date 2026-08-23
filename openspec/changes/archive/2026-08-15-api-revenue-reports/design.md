## Context

Everything this report needs already exists, but the two sides it joins are shaped differently. `Invoice` carries `year` and `month` as integers and reaches a building only through `lease → room → building`; `Expense` carries a single `incurredAt` timestamp and holds `buildingId` directly. Amounts on both are `Decimal(14,0)`. `Invoice.paidAt` and `voidedAt` exist, and payment is atomic — an invoice is paid in full or not at all. See proposal.md for motivation.

Decisions locked before this design (from prior exploration, not reopened here): billing figures key on the billed month, never `paidAt`; both net figures are reported; expenses break down by category on totals only; per-building rows plus a grand total; months and buildings with no activity appear as zeros.

## Goals / Non-Goals

**Goals:**
- Make a month's figures stable, so two months can be compared without one of them shifting underneath.
- Answer "what did it earn" and "what actually arrived" in one request, without forcing a choice between them.
- Return a shape a caller can chart directly, with no gap-filling.

**Non-Goals:**
- No cash-flow view keyed on `paidAt` — a different question, and folding it in would break `outstanding`.
- No room-level or per-tenant breakdown. The description asks for buildings and months.
- No export formats, currency formatting, or presentation concerns.
- No caching or materialised totals. At this data volume the queries are cheap, and a cache would need invalidating on every invoice and expense write.

## Decisions

**Billing figures key on `year`/`month`, not `paidAt`**: this is the decision the report's usefulness rests on. Keying collected on the payment date would make `billed = collected + outstanding` false, because the three would describe different sets of invoices — a March invoice paid in May would inflate May's collected while March's outstanding never fell. Keying everything on the billed month keeps the three coherent and keeps each month's figures stable once its invoices are issued. The cost is that the report says nothing about when cash actually arrived, which is why `paidAt` remains recorded and a cash-flow view stays explicitly out of scope rather than being approximated here.

**`outstanding` is summed, not subtracted**: because payment is atomic, every invoice belongs wholly to collected or to outstanding. Summing the unpaid invoices directly and asserting that it equals `billed − collected` turns an invariant into a check: if the two ever disagree, something is wrong with the data rather than the arithmetic. Alternative considered: deriving it as `billed − collected` — rejected because it can never disagree, and therefore can never reveal a problem.

**Both net figures, named for what they mean**: `netBilled` and `netCollected` rather than a single `net`. A single figure would force a silent choice between "what the month earned" and "what actually landed", and whichever were chosen, some caller would misread it. Naming both makes the basis explicit at the point of use.

**Two grouped queries, assembled in code**: invoices group by `(buildingId, year, month)` after joining through lease and room; expenses group by `(buildingId, year-month of incurredAt)`. Because the two sides are dated and reached differently, a single SQL statement spanning both would need a union over dissimilar shapes or a full outer join on a synthesised month key — harder to read and no faster at this volume. Fetching two grouped result sets and merging them against a generated month grid keeps each query simple and puts the zero-filling in one obvious place.

**The month grid is generated, not derived from the data**: the range's months are enumerated first, then figures are placed into them. Building the grid from whatever rows came back would omit exactly the empty months a caller most needs to see as zero, and would make a chart silently skip February.

**Retired buildings are included by default**: omitting `buildingIds` covers every building regardless of `isActive`. A building retired last year still earned money the year before, and excluding it would make historical totals quietly wrong. An owner wanting only current properties can name them explicitly.

**Amounts stay integral**: all sums are over `Decimal(14,0)` columns, so no rounding happens anywhere in the report — the figures are exact sums of amounts already rounded when their invoices and expenses were written. Net figures may be negative when expenses exceed income, and are reported as such rather than clamped, since a loss-making month is information rather than an error.

**No pagination envelope**: the report is one computed structure, not a page of records. Wrapping it in `{ data, meta }` would imply there are further pages of a collection that does not exist. This is the sole endpoint departing from that contract, which is why the spec asserts it explicitly.

## Risks / Trade-offs

- [An unbounded range over all buildings produces a large response and two heavy grouped queries] → acceptable at the expected scale of a handful of buildings and a few years of history; the shape is bounded by `buildings × months`, both small. If either grows, a range cap or per-building pagination is the natural next step, and is easier to add than to remove.
- [Reporting nothing about when cash arrived may surprise an owner reading "collected"] → mitigated by naming the field alongside `billed` and `outstanding`, where its basis is evident, and by keeping the cash-flow view as a named out-of-scope item rather than an unspoken gap.
- [The invariant `billed = collected + outstanding` depends on payment remaining atomic] → true today and asserted in the spec; if partial payments are ever introduced, that requirement is the first thing that must change, and the spec scenario will fail rather than the figures quietly drifting.
- [Zero-filling makes responses larger than the data warrants] → deliberate: a caller charting the result would otherwise have to reconstruct the missing months, and a chart with a silently absent month misleads more than a visible zero.

## Migration Plan

No database change, no migration, and no data to backfill — the report reads existing tables. Deploy is a straight code release. Rollback is reverting the release; nothing is written, so there is no state to undo.
