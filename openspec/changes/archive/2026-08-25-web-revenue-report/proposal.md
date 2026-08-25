## Why

Every screen built so far records something. None of them answers the question the owner is actually recording it for: **is this working, and where is my money?**

The API has answered that question for months. It reports, per building and month, what was billed, what has been settled, what is still owed, what was spent, what the two net figures come to, a breakdown of costs by kind and of owner-named charges by kind, and — separately from all of those — the money that actually arrived. None of it is reachable.

It is also, now, worth reading. Until this week the report subtracted no costs at all, so every figure in it was too flattering by an unknowable amount. With billing and costs both recordable, the report finally describes the business rather than a fragment of it.

There is one thing the screen has to get right that the API cannot get right on its behalf. Two of these figures answer different questions and look identical side by side:

```
settled   what was BILLED in this month and has since been paid   (accrual)
received  what money ARRIVED in this month, whenever it was billed (cash)
```

An invoice issued in March and paid in May counts toward March in one and May in the other. Presented as two numbers in a row, they will be read as a discrepancy, and the reader will conclude one of them is broken.

## What Changes

- **A revenue screen**: a range of months, optionally narrowed to particular buildings, showing each month's figures and the totals across the range.
- **The accrual figures and the cash figure are kept visibly apart**, and each says what it counts. This is the whole reason the screen needs designing rather than tabulating.
- **The breakdowns are shown as what they are**: costs by kind, and owner-named charges by kind. The charge breakdown is a *partition* of what was billed rather than an addition to it, and the screen must not invite anybody to add it on top.
- **Months with no activity are shown as zero rather than omitted.** A gap in a table reads as missing data; a zero is a fact about a month, and a building that earned nothing in April needs to say so.
- **What is still owed is reachable from here**, since "who has not paid" is the question a reader of this screen asks next, and the answer is a filter that already exists on the invoices screen.

Deliberately NOT in this change:

- **Charts.** A monthly table of six figures is already legible, and a chart of two months is decoration. Worth revisiting when a year of real data exists.
- **Exporting.** No format has been asked for, and inventing one produces a file nobody's accountant wants.
- **A dashboard or landing page.** A different thing from a report, and it would need its own decisions about what an owner sees first.

## Capabilities

### New Capabilities

- `web-revenue-report`: the owner's screen for what a building earned, what it cost, and what has actually come in.

### Modified Capabilities

None. The report API is complete, read-only, and already specified; nothing about it changes.

## Impact

- `frontend/src/features/reports/` — new: the range picker, the monthly table, the totals and breakdowns.
- `frontend/src/app/` — a route, and the last placeholder in the navigation is replaced.
- No backend change of any kind.
