## Why

The invoice list shows four columns — period, tenancy, amount, status — and orders them oldest first.

Two things it does not say are things the owner has to know to read a row at all. **What kind of bill it is**: a move-in bill (deposit plus first rent), a month, a closing bill, an overdue bill, a one-off charge. The amount alone does not tell them apart, and 4.908.500 đ means something different depending on which it is. **When it was issued**: a bill from March and a bill from last week look identical on this screen.

Ordering oldest first puts the bills that matter — this month's, the unpaid ones — on the last page. The tenancy list was fixed for exactly this reason and records the argument; the invoice list was left as it was.

And filtering: an owner can narrow by building, room, month and settled-or-not, but not by kind. "Show me the move-in bills" and "show me the one-off charges" have no answer.

## What Changes

- The list shows **what kind of bill** each row is, and **when it was issued**.
- A **filter by kind**, beside the filters that already exist.
- The owner can **choose the order**: what is owed first (unpaid before paid), newest first, or oldest first. Live bills always come before withdrawn ones, whichever is chosen.
- The **default order changes**: unpaid first, then newest first. Today it is oldest first, which buries the bills an owner opens this screen to act on.
- Filtering and ordering happen in the API, not in the browser. The list is paginated, so sorting a page client-side would sort thirty of two hundred rows and call it sorted.

## Capabilities

### Modified Capabilities

- `invoice`: listing accepts a kind filter and an explicit order, and its default order changes.
- `web-invoices`: the list shows the kind and the issue date, filters by kind, and lets the owner choose the order.

## Impact

- `backend`: the invoice list query schema and its `where`/`orderBy`. No schema change, no migration.
- `frontend`: `InvoiceList`, `InvoicesPage` filters, the invoice API params.
- **Behaviour change for anyone relying on the default order** — the only caller is this frontend.
- New Vietnamese strings, reported for review rather than chosen silently.
