## Context

`LeaseInvoicesPanel` fetches `pageSize: 100` for one lease and sorts the result
in the browser by period. It sums the outstanding balance over what it fetched,
and warns when the list reports more than arrived — a guard added because a
balance computed from part of the bills is a wrong number wearing a confident
label.

## Goals / Non-Goals

- Goal: every bill of a tenancy reachable from the tenancy.
- Goal: the paging is the API's, so it is correct beyond the first page.
- Non-Goal: a balance inside the dialog. A page of bills cannot be summed into
  the tenancy's debt, and the panel already states that figure from the fetch it
  guards.
- Non-Goal: a tenancy filter on the invoice screen. That screen is organised
  around rooms and periods; a tenancy is not one of its axes.

## Decisions

### The dialog pages from the API, ordered `newest`

The panel's client-side sort exists because it holds the whole list. The dialog
does not, so it asks the API for `sort: 'newest'` and pages with the shared
`Pagination`. Sorting a page in the browser would produce an order that is
right within each page and wrong across them.

### The row is extracted, not copied

The panel's row — period or type, payment chip, amount, chevron, linking to the
invoice — moves into a component both use. Two copies drift the first time one
is edited, and these two sit ten lines apart in the same feature.

### The panel keeps its own fetch

It still asks for its hundred and still guards the balance it sums. The dialog
is a second, independent question; sharing one query between them would make the
panel's balance depend on which page of the dialog was last open.

## Risks / Trade-offs

- **Two queries for the same tenancy's invoices.** Accepted: they ask different
  questions (all of it, versus one page of it), and react-query caches each.
