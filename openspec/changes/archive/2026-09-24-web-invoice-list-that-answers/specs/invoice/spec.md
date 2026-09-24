## MODIFIED Requirements

### Requirement: Owner can list, filter, and retrieve invoices

The system SHALL allow an authenticated `owner` to retrieve an invoice by id and to list invoices filtered by building, room, lease, billed month, payment status, **and kind**. Listing SHALL use the shared paginated response contract.

The caller SHALL be able to choose the ORDER: by what is owed (unpaid before paid), by issue date newest first, or by issue date oldest first. Ordering SHALL be applied by the system, not left to the caller, because the response is one page of a larger set — a page sorted after it arrives is thirty rows of two hundred in the wrong order.

Within any chosen order, invoices that are still live SHALL come before withdrawn ones. A withdrawn bill is a record of what was cancelled; it is never the row an owner is looking for, and it should not sit between two that are.

**The default order SHALL be what is owed, then newest first.** An owner opens this list to act on money — this month's bills, and whatever is still unpaid. Ordering oldest first puts both on the last page, which is the same defect the tenancy listing already records.

Ordering SHALL be total: where two invoices sort equally on every chosen key, their ids SHALL decide, so no invoice can move between pages as pages are fetched.

#### Scenario: Filtering by month
- **WHEN** an authenticated owner lists invoices for a given year and month
- **THEN** the response contains only invoices covering that month

#### Scenario: Filtering by payment status
- **WHEN** an authenticated owner lists invoices filtered to pending ones
- **THEN** the response contains only invoices that have not been paid or voided

#### Scenario: Filtering by building
- **WHEN** an authenticated owner lists invoices filtered by a building id
- **THEN** the response contains only invoices for rooms in that building

#### Scenario: Filtering by kind
- **WHEN** an authenticated owner lists invoices filtered to one kind
- **THEN** the response contains only invoices of that kind

#### Scenario: The default order puts money owed first
- **WHEN** an authenticated owner lists invoices without naming an order
- **THEN** unpaid invoices come before paid ones, and within each the most recently issued comes first

#### Scenario: Ordering by issue date
- **WHEN** an authenticated owner lists invoices ordered oldest first
- **THEN** the earliest issued invoice is first, regardless of whether it is paid

#### Scenario: Withdrawn bills sort last
- **WHEN** an authenticated owner lists invoices including withdrawn ones
- **THEN** every live invoice comes before every withdrawn one, in whichever order was chosen

#### Scenario: The order is total
- **WHEN** two invoices are equal on every key of the chosen order
- **THEN** their relative order is decided by id, and does not change between requests

#### Scenario: Retrieving an invoice that does not exist
- **WHEN** an authenticated owner requests an invoice id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Invoice listing is paginated
- **WHEN** an authenticated owner lists invoices
- **THEN** the response is the shared paginated shape, with the invoices in `data` and the page, page size, and totals in `meta`
