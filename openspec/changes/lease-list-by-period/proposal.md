## Why

The tenancy list carries one column, "Thời gian ở", holding two facts joined by a dash: when the tenancy began and the last day it covers. A reader scanning for "which tenancies end this quarter" has to read every cell and split it by eye, and neither half can be lined up against the rows above it.

And there is no way to ask by date at all. The filters narrow by building, room, person, in-service and term-run-out. "Everything signed since March", "everything that has finished by December", "everything that ran and ended inside the second half of the year" — each has no answer short of paging through the list.

## What Changes

- The tenancy list splits two crowded columns into four: **began** and **ends**, **room** and **building**. Each lines up down the page.
- The rooms list gains, for every room currently let, **the day it comes free** — and opening a let room opens **the tenancy in it**, which is where everything an owner wants about that room actually lives.
- A **period filter** with two independent bounds. **From** constrains where a tenancy STARTS — began on or after that day. **To** constrains where it ENDS — ended on or before that day. Given both, only tenancies that ran entirely inside the period are listed.
- Either bound may be left empty, because "everything signed since March" and "everything finished by December" are each a question on their own.
- The end used for the to-bound is the day the tenancy actually covers to: the recorded move-out where there is one, the agreed end otherwise.
- **Cancelled tenancies never match.** They covered no days; the status exists to say so.
- Matching happens in the API, like every other filter on this list.

## Capabilities

### Modified Capabilities

- `lease`: the listing can be bounded by when a tenancy began and when it ended.
- `web-leases`: the list shows the dates and the room/building as separate columns, and offers the two bounds.
- `room`: a let room reports the tenancy holding it and the day it comes free.
- `web-rooms`: a let room shows that date, and opening it opens the tenancy.

## Impact

- `backend`: the lease list query schema and its `where`. No schema change, no migration.
- `frontend`: `LeaseList` columns, `LeasesPage` filters, the lease API params, `RoomList` and the rooms screen's row click.
- New Vietnamese strings, reported for review rather than chosen silently.
