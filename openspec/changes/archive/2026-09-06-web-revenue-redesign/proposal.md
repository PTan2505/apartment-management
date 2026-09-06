## Why

The revenue screen holds the figures an owner runs the business on and presents them as a wall of equal-weight numbers. Nothing leads. Whether the month made money is a subtraction the reader performs, and how this month compares to the last eleven is not on the screen at all — the months are a table of rows, which is the shape that hides a trend.

The new design fixes both. Four figures lead: billed, collected, still owed, spent. The profit is stated rather than left to be computed. And a chart puts the months side by side, which is where a run of falling collection becomes visible instead of arithmetical.

## What Changes

- Four summary figures lead the screen — billed, collected, outstanding, spent — each with the share it represents, so a proportion is read rather than divided out.
- The profit is stated as its own band, with the subtraction that produced it spelled out. It may be negative; a loss-making month is information, not an error state.
- **New**: a twelve-month chart comparing what was billed against what was collected, so a trend reads at a glance. It draws from the months the report already returns.
- Expenses by category get bars and shares alongside the amounts.
- The month table and the per-building sections keep their figures and gain the design's typography and spacing.
- The filters stay as they are: a building, and a **from–to month range**. The design shows a single month; keeping the range was chosen deliberately, because narrowing it would remove the ability to look at a period and would break every saved address carrying `from` and `to`.
- `recharts` is added as a dependency. The project has no charting library, and the chart is the one part of this design that cannot be honestly faked with a few divs.

### Kept, against the design

The design has no place for **"Tiền thực nhận"** — cash keyed on the date it arrived, whatever month it was billed for. It stays, in a section of its own, with the note explaining why it deliberately does NOT match the table above it.

That figure and its separation are the reason this screen was built the way it was. An invoice issued in March and paid in May belongs to March's `settled` and May's `received`, and a reader who sees two adjacent numbers disagree concludes the report is broken rather than that they measure different things. Adopting a design that has no slot for it would delete the distinction the screen exists to preserve.

### Deliberately not built, because the API does not report it

The report aggregates by month and by building; below that it holds nothing. So these are named here and left out rather than assembled in the browser:

**The per-room payment table** — nine columns and a row per room, the largest single element of the design. `GET /reports/revenue` has no room-level data at all.

Also absent: the room counts beside each figure (`28 phòng`, `22`, `6`), the count of expense vouchers (`5 phiếu chi`), the building's street address, the average collection rate after the 15th of the month, the data-freshness timestamp, and the export action.

Building the room table from the invoice list instead was considered and rejected. It would be a second revenue report computed in the browser from a different source, free to disagree with the one this screen is named after — and a report that disagrees with itself is worse than a report missing a section.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-revenue-report`: the screen gains a stated reading order, a stated profit, a trend over months, and an explicit rule that the cash figure is never presented as comparable to the billed ones.

## Impact

- `frontend/src/features/reports/RevenueReportPage.tsx`, and one new presentational component for the chart under `features/reports/`.
- `frontend/package.json` — adds `recharts`.
- **No change to `api.ts`, to any hook, to any request, or to any data shape.** No backend change.
