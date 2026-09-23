## 1. Six states

- [x] 1.1 `overdue`, `dueSoon`, `upcoming` derived beside `active`, `finalized`, `cancelled`
- [x] 1.2 The two-week window defined once, shared by the mapper and the ordering
- [x] 1.3 A cancelled or finished tenancy keeps its state whatever its dates say

## 2. Filter and order

- [x] 2.1 `status` accepted on the listing, replacing the `active` and `overdue` booleans
- [x] 2.2 Ordered overdue → dueSoon → active by end date, then upcoming, finalized, cancelled
- [x] 2.3 Most recently signed first within the later groups, id as the final key
- [x] 2.4 Filters still combine: building, room, occupant, period

## 3. The screen

- [x] 3.1 Every row says which of the six states it is in
- [x] 3.2 The status filter offers all six; the "Cần xử lý" switch is gone
- [x] 3.3 Two counts above the list, each filtering the list when selected
- [x] 3.4 A count of zero is shown as zero

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`

## 6. Verify in a visible browser

- [x] 6.1 An overdue tenancy is at the top, and says so — read back against the API
- [x] 6.2 Running tenancies are in end-date order, soonest first
- [x] 6.3 Finished and cancelled are below everything else, cancelled last
- [x] 6.4 Each status filter returns only that state, counted against the API
- [x] 6.5 Both counts match the filtered lists they lead to
- [x] 6.6 A tenancy signed for a future date reads as not yet started
- [x] 6.7 390px
