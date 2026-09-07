## Context

See proposal.md — Why.

`RevenueReportPage.tsx` renders a month table per building and a mobile card list, both from `MonthFigures`. `api.ts` sends `from`, `to` and `buildingIds`. `api-report-detail` added `counts` to every month and, behind `detail=rooms`, a `rooms` array.

## Goals / Non-Goals

Showing the rooms and the counts. Not: a cash figure per room, a due date, or the four fields nothing reports — each named in the proposal.

## Decisions

### The detail is requested unconditionally, and that is a change of mind worth stating

The API made it opt-in so a caller wanting totals would not pay for a room list. This screen always wants it: the room rows are the reason the change exists, and a second request when the reader expands something would mean the totals and the detail could be fetched either side of an invoice being issued.

The cost is bounded by the range the owner already chose. A twelve-month report over several buildings is the large case, and it is large in the same proportion the table already was.

### The rooms go under the month, not beside it

The table lists months down the page. Rooms belong to one month, so they expand from its row rather than forming a second table the reader has to align by eye.

Collapsed by default: the screen's job is still the month figures, and eight rooms per month over twelve months is a wall.

### The unbilled count is the one given emphasis

Of the four counts, three restate what the amounts already say. "Let, and billed nothing" is the only one that reveals something no figure on the screen would: a room nobody invoiced produces no amount anywhere, so it is invisible precisely when it matters.

### Nothing is computed here

The counts and the room figures are reported by the API. The screen does not re-derive them, does not sum the rooms to check them, and does not fill in a room the API omitted. If the rows and the total ever disagree, that is a bug to fix in the report rather than paper over in the reader.

## Risks / Trade-offs

- **Response size grows for every reader of this screen.** → Bounded by the chosen range; the alternative was a second request that could disagree with the first.
- **A room row could be mistaken for a bill.** It aggregates a month's invoices for a room, which for a tenancy with two invoices in one month is not any single bill. → The row carries no invoice number and no action; it names a room and a tenancy.

## Migration Plan

None. Presentational, no persisted state.

## Open Questions

None.
