## Context

`formatRemainingTerm` already counts whole calendar months and days from today
to the last day a tenancy covers, and returns null once that day has passed —
which is why an overdue tenancy shows nothing. The six states derived by the API
(`overdue`, `dueSoon`, …) already say which case a tenancy is in, and the list
already colours them.

## Goals / Non-Goals

- Goal: the figure answers "do I ring them this week?" at a glance.
- Non-Goal: a new API field. The dates are already on the tenancy, and a second
  place that computes a duration is a second place for it to be wrong.
- Non-Goal: changing the list. A row says which state it is in; the detail
  screen is where the exact figure belongs.

## Decisions

- **Count from the last day covered, in both directions.** `coveredThrough`
  already converts the stored exclusive boundary, and every date on this screen
  goes through it. Counting overdue days from the boundary instead would report
  a tenancy as on time on the first day it is not.
- **Overdue reads in the same units as remaining** — months and days, not a raw
  day count — so "Quá hạn 1 tháng 6 ngày" sits beside "Còn 3 tháng 2 ngày" as
  the same measurement pointing the other way.
- **The state decides the emphasis, not a second date comparison.** `dueSoon`
  and `overdue` come from the API; re-deriving "is it nearly over" in the
  browser would let the mark and the chip above it disagree.
- **Wording follows what is already on screen**: "Còn 5 ngày" exists today;
  "Quá hạn 5 ngày" is its mirror.

## Risks / Trade-offs

- An emphasised figure on a screen that also carries a red "Quá hạn" chip says
  the same thing twice. Accepted: the chip says which state, the figure says how
  far — and the second is the one an owner acts on.
