## Context

See proposal.md — Why.

`RevenueReportPage.tsx` is one file of about 500 lines holding the filters, a per-building section, a month table, a mobile card list, and the cash section. Everything comes from one `useRevenueReport({ from, to, buildingIds })` call, and the page does no arithmetic beyond formatting.

Three constraints shape the work, the first two set by the owner:

1. **Presentation only.** No change to `api.ts`, to any hook, to any request, or to any data shape.
2. **Nothing invented.** The design shows seven things the report does not hold — the whole per-room table above all — enumerated in the proposal and left out.
3. **The cash figure survives.** `received` keeps its own section and its own explanation. This is not a preference; the spec now says so.

## Goals

- Four leading figures with their shares, and a stated profit.
- A twelve-month chart of billed against settled.
- Categories with bars, tables with the design's typography.
- Both layouts, since the project has one breakpoint and two of them.

## Non-Goals

- Any backend work, and any browser-side reconstruction of what the backend does not return.
- The filters. They stay a building selector and a from–to range.
- The sidebar, which the design renames along with the product itself. Different screen, and a decision the owner has not made.

## Decisions

### The chart draws `billed` against `settled`, never `received`

Both are keyed on the month the invoice was ISSUED, so a shared month axis says something true about them. `received` is keyed on the day money arrived; drawn as a third series it would silently assert a keying it does not have, and the reader would read the gap between it and `billed` as an amount owed. It is not.

This is why the new spec requirement names the chart explicitly. The rule already existed for the figures; a chart is a new way to break it, and the wording had to reach it.

The chart is labelled with what it charts, in the words already on the screen: `Đã xuất hoá đơn` and `Đã thu`. The design labels the second series `Đã thu thực tế` — reported to the owner rather than adopted, because "thực tế" is exactly the phrase the cash figure has earned and lending it to an accrual series would undo the distinction in a caption.

### `recharts`, chosen over hand-drawn SVG

A grouped bar chart with an axis, a legend and hover readouts is a few hundred lines to write and a long tail of detail to get right — tick spacing, label collision, a tooltip that follows the pointer. The owner chose the library.

The cost is real and worth stating: it is the largest dependency in the frontend, and the build already warns that a chunk exceeds 500 kB. The chart therefore goes in its own component so that a later change can load it lazily without touching the page.

### The summary figures are computed, and the computation is arithmetic already in the payload

`total.billed`, `total.settled`, `total.outstanding`, `total.expenses` come straight from the report. The shares are divisions between them, and the profit is `netBilled`, which the API already reports rather than something derived here.

Division by zero is the case that matters: a range with nothing billed makes every share `0/0`. The share is omitted in that case rather than rendered as `NaN%` or as `0%` — the first is a bug on screen and the second is a claim that nothing was collected, which is not the same as there being nothing to collect.

### The chart is withheld on a one-month range

`recharts` will happily draw one pair of bars. A chart is a claim about direction, and one bar makes no claim while looking exactly like one that does. Below two months, the screen says the range is too short.

### Two columns, then one

Desktop puts the chart beside the category breakdown, as in the design. On a phone they stack, chart first: the trend is what a small screen can still usefully show, and a category list reads fine below it.

## Risks / Trade-offs

- **A charting library for one chart.** → Isolated in its own component, so it can be lazily loaded later without touching the page. The alternative was hand-drawn SVG, which the owner considered and declined.
- **The design's own words would break the spec.** `Đã thu thực tế` on an accrual series is the exact confusion the screen guards against. → Reported to the owner, not adopted; the existing `Đã thu` is used.
- **A screen that leads with four large figures makes them look authoritative.** An owner reading `Đã thu` as cash in the bank would be wrong — it is money billed in this range that has since been paid. → The share beneath each figure names its denominator, and the cash section keeps saying what it separately counts.
- **The per-room table is the largest thing in the design and it is not being built.** The screen will not look like the picture. → Named in the proposal as an API change so its absence is a recorded decision rather than an oversight.

## Migration Plan

None, beyond installing the new dependency. Presentational, no persisted state, no data shape touched.

## Open Questions

None. The seven unreported fields, the filter shape, the charting library and the fate of the cash figure were all put to the owner before this document was written; the answers are recorded in the proposal.
