## Why

The revenue screen states what a month earned and stops at the building. Every question that follows is "which room" — which ones have not paid, how many the figures cover — and answering it means leaving for the invoice list and narrowing it back down to the building and month already on screen.

This was the largest element of the screen's design and it could not be built: the report held nothing below a building. `api-report-detail` has since added it. This change spends that.

## What Changes

- The screen asks for room detail and shows it: for each building and month with activity, the rooms behind the figures, each with the tenancy, who is responsible, and what was billed, collected and outstanding.
- Each month states how many rooms it covers, how many are collected, how many are outstanding, and how many were billed nothing at all.
- Expense totals state how many records they are made of.
- The room detail is requested only when the screen can use it, so nothing else on the report starts paying for a room list.

## Deliberately not built

**A cash figure per room.** The API does not report one and should not: `received` is keyed on the day money arrived while every room figure is keyed on the month an invoice was issued, and putting the two in one row reproduces — at a finer grain, where it is harder to see — the confusion this screen exists to prevent.

**A due date column.** The owner decided against invoice due dates. The design showed one.

**The four other things the design shows that nothing reports**: the building's street address, a reconciliation period, a freshness timestamp, and the owner's support number. Named in `web-revenue-redesign`'s archived proposal and still absent.

## Capabilities

### Modified Capabilities

- `web-revenue-report`: the screen shows the rooms behind a month's figures and the counts those figures cover.

## Impact

- `frontend/src/features/reports/` — types, the request, and the screen.
- The request gains one parameter. Nothing else about what the screen asks for changes.
- No backend change: `api-report-detail` shipped what this reads.
