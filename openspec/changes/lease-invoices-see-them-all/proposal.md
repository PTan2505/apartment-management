## Why

The tenancy screen's billing panel asks for a hundred invoices, shows them all
in one unbroken list, and when a tenancy has more than that it says so and
stops — there is nowhere to go. The invoice screen cannot help: it filters by
building, room, period and payment status, never by tenancy, and a room outlives
its tenancies, so sending the reader there would answer a different question.

Meanwhile the ordinary case has the opposite problem. A two-year tenancy puts
twenty-odd bills in a card beside the terms, and the card is as tall as the rest
of the page put together.

## What Changes

- The panel shows the most recent bills and offers **Xem tất cả**, which opens
  every bill of that tenancy in a dialog, paginated.
- The dialog's order and paging come from the API, so page two is the real page
  two rather than the tail of whatever the panel happened to fetch.
- The panel's note about showing only part of the list now points at that
  dialog instead of apologising with nowhere to go.

## Impact

- Affected specs: `web-leases`
- Affected code: `frontend/src/features/leases/LeaseInvoicesPanel.tsx`, plus the
  dialog and the shared row beside it
