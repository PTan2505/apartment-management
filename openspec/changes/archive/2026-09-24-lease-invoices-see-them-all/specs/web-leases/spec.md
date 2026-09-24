## ADDED Requirements

### Requirement: Every bill of a tenancy can be opened from its own screen

The tenancy screen SHALL offer a way to see every invoice of that tenancy,
paginated, without leaving the tenancy.

The panel beside the terms SHALL show only the bills still owed — issued, not
withdrawn, not paid. What an owner opens a tenancy to check is what is still to
be collected; a settled bill from four months ago is history, and a tenancy
running two years otherwise makes that card taller than the rest of the screen
together.

The panel SHALL still say how many bills the tenancy has in total, so the ones
it is not showing are accounted for rather than silently absent.

The full listing SHALL be ordered and paged by the API. Ordering the rows that
happen to have been fetched produces a second page that is not the second page.

Each row SHALL open that invoice, as the rows in the panel already do.

#### Scenario: Opening the full list

- **WHEN** the owner chooses to see all of a tenancy's bills
- **THEN** every bill of that tenancy is listed, a page at a time, without leaving the tenancy screen

#### Scenario: The count is stated

- **WHEN** the full list is open
- **THEN** it says how many bills the tenancy has in total

#### Scenario: Paging

- **WHEN** the owner moves to the next page
- **THEN** the next bills of that tenancy are fetched and shown, in the same order

#### Scenario: Opening a bill from the list

- **WHEN** the owner selects a bill in the full list
- **THEN** that invoice's own screen opens

#### Scenario: A tenancy with few bills

- **WHEN** a tenancy has fewer bills than one page
- **THEN** the full list shows them with no pager, and the panel still offers to open it

#### Scenario: The panel lists what is owed

- **WHEN** a tenancy has both settled and unpaid bills
- **THEN** the panel lists the unpaid ones, and the full list is where the settled ones are

#### Scenario: Everything settled

- **WHEN** every bill of the tenancy has been paid
- **THEN** the panel says so rather than reading as a tenancy that was never billed, and still offers the full list
