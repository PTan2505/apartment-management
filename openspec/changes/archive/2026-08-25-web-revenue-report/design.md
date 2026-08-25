## Context

See proposal.md — Why. What shapes the approach:

- The report API is complete, read-only, and specified. It returns per-building month rows plus per-building and grand totals, with `expensesByCategory` and `chargesByCategory` on the totals only — not per month.
- `billed` equals `settled` plus `outstanding` exactly, because an invoice is paid in full or not at all. That identity is worth preserving on screen: it is what lets a reader check the table against itself.
- `received` is the only cash figure. Every other figure is keyed on the month an invoice was issued.
- `chargesByCategory` is a partition of `billed`, not an addition to it. The API's own documentation says so because the mistake is easy.
- `netBilled` and `netSettled` may be negative. A loss-making month is information, and the API deliberately does not clamp it.

## Goals / Non-Goals

**Goals:**

- Make the report readable by somebody who did not build it.
- Keep the accrual figures and the cash figure from being read as one another.
- Lead the reader from a number to the thing it is about.

**Non-Goals:**

- Charts, exports, a dashboard.
- Any backend change. Nothing about the report is missing.

## Decisions

**The cash figure gets its own section, not a column.**

The obvious layout is one row per month with every figure as a column, and it is the one thing that must not happen. `settled` and `received` over the same month are different questions — an invoice issued in March and paid in May sits in March's `settled` and May's `received` — and side by side in a row they read as a discrepancy. A reader who spots an unexplained disagreement between two adjacent numbers does not conclude they measure different things; they conclude the report is broken, and stop trusting the rest of it.

So the monthly table carries the accrual figures, and money-arrived is presented separately with its own heading saying what it counts. The two are never adjacent and never differenced.

**The table preserves `billed = settled + outstanding` visibly.**

Those three are shown together, in that order, because the identity between them is the reader's only way to check the table against itself. Splitting them across sections would discard a free correctness check.

**Charges-by-kind is rendered inside what was billed, not beside it.**

Presented as its own total next to `billed`, a reader adds the two and counts the same money twice. It is placed under the billed figure, labelled as a part of it. This is a single heading's worth of care preventing the exact error the API's shape was designed to prevent.

**The default range is the last six months, not empty.**

A screen that opens with no range asks the reader to specify a question before answering one. Six months is long enough to show a trend and short enough to read without scrolling, and the range is changeable.

**Buildings are reported separately, always — even when there is one.**

The API returns per-building sections and a grand total. Collapsing the single-building case into just the grand total would mean the screen's shape changes depending on the data, and an owner who adds a second building would find the report rearranged. The building heading stays; the grand total is shown when there is more than one building to total.

**The outstanding figure links to the unpaid invoices.**

That filter already exists on the invoices screen. Adding a route from the figure to the bills behind it costs a link and saves the reader assembling the same query by hand every time they read this screen.

## Risks / Trade-offs

**A reader still compares settled and received across sections** → Possible, but they have to go looking, and each carries a sentence saying what it counts. The alternative — omitting the cash figure — hides the only number that answers "did the money actually come in".

**Negative net figures look like errors** → They are rendered as negative and coloured as losses rather than hidden or clamped. A month that lost money is a fact the owner needs; a report that cannot express one is worse than one that does so bluntly.

**Six months of two buildings is a lot of rows on a phone** → The monthly table becomes cards on a narrow viewport, as everywhere else in this application.

## Migration Plan

None. A new frontend route reading an existing endpoint; rollback is reverting the commit.
