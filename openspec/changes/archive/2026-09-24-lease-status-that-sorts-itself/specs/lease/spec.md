## REMOVED Requirements

### Requirement: Owner can list, filter, and retrieve leases

**Reason**: It fixed the order as most-recently-begun first and exposed "term has run out" as a filter of its own, separate from status. Both are replaced: the term running out is now a STATUS a lease reports, and the order is by what needs attention rather than by signing date. Its scenarios assert the old order and the old filter, so they cannot stand beside the new ones.

**Migration**: `overdue=true` becomes `status=overdue`, and `active=true|false` becomes a status value. The only caller is this project's frontend. Replaced by "Owner can list leases by status, in the order they need attention" below, which keeps building, room and occupant filtering and the paginated contract.

## MODIFIED Requirements

### Requirement: Lease status, expected end date, and tenant are derived

A lease SHALL report a status derived from its own dates rather than stored, together with the expected end of its term and the person responsible for it.

The status SHALL distinguish six states:

- **cancelled** — a cancellation is recorded; the tenancy never took place
- **finalized** — a move-out is recorded; the tenancy is over
- **upcoming** — it has not started: the start date is still in the future
- **overdue** — the agreed term has ended and no move-out has been recorded
- **dueSoon** — it is running and its term ends within FOURTEEN DAYS
- **active** — it is running with more than fourteen days left

Derived rather than stored because a stored status is a second place for a fact the dates already carry, and the two drift the moment one is written without the other. Every one of these is a question about today, and today changes without anything being written.

Overdue is a state the system creates and nothing else announces: such a tenancy still holds its room, no further invoice can be issued for it, and until this it read as an ordinary running tenancy.

Two weeks for dueSoon, because that is the window in which an owner still has time to ask whether the tenant is staying and to look for another if not.

The expected end SHALL be the start date plus the agreed months, and SHALL be reported so a caller can show what the tenancy agreed without recomputing it.

#### Scenario: Expected end date reflects start date and duration
- **WHEN** an authenticated owner retrieves a lease starting 2026-01-15 with an agreed duration of 12 months
- **THEN** the response reports an expected end date of 2027-01-15

#### Scenario: The expected end date is the first day not covered
- **WHEN** a lease begins 2026-01-01 with an agreed duration of six months
- **THEN** its expected end date is 2026-07-01 and the last day it covers is 2026-06-30

#### Scenario: A renewal begins where the previous term ended
- **WHEN** a lease's expected end date is 2026-07-01 and a new lease for the same room begins on that date
- **THEN** the two tenancies neither overlap nor leave a day uncovered

#### Scenario: A move-out date is the first day not covered
- **WHEN** a lease records a move-out dated 2026-07-05
- **THEN** the last day it covers is 2026-07-04

#### Scenario: A renewal begins on the date the previous tenancy ended
- **WHEN** a lease records a move-out dated 2026-07-05 and a new lease for the same room begins on 2026-07-05
- **THEN** the two tenancies neither overlap nor leave a day uncovered

#### Scenario: A tenant who left after the term is recorded as they left
- **WHEN** an authenticated owner records a move-out dated after the lease's expected end date, because the tenant stayed on and neither party wanted a renewal
- **THEN** the system accepts it and records that date, rather than requiring a date that did not happen

#### Scenario: Lease without a move-out date is active
- **WHEN** an authenticated owner retrieves a lease that has no move-out date, has not been cancelled, has started, and has more than fourteen days of its term left
- **THEN** the response reports the lease as active

#### Scenario: Lease with a move-out date is finalized
- **WHEN** an authenticated owner retrieves a lease that has a move-out date
- **THEN** the response reports the lease as finalized

#### Scenario: A cancelled lease reports itself as cancelled

- **WHEN** an authenticated owner retrieves a lease that has been cancelled
- **THEN** the response reports it as cancelled, distinct from both active and finalized

#### Scenario: Expected end date follows an updated duration
- **WHEN** an authenticated owner changes a lease's agreed duration
- **THEN** the expected end date reported for that lease changes accordingly

#### Scenario: Reported tenant follows a transfer of responsibility
- **WHEN** primary responsibility for a lease is transferred to another occupant
- **THEN** the lease reports that person as its tenant

#### Scenario: Deposit amount is derived from the agreed rent
- **WHEN** an authenticated owner retrieves a lease with an agreed rent of 3,000,000 and a deposit of two months
- **THEN** the response reports a deposit amount of 6,000,000

#### Scenario: A zero-month deposit reports a zero amount
- **WHEN** an authenticated owner retrieves a lease whose deposit is zero months
- **THEN** the response reports a deposit amount of zero

#### Scenario: Deposit amount ignores a later change to the room's rent
- **WHEN** a room's base rent is changed after a lease on it was created
- **THEN** that lease still reports a deposit amount derived from its own agreed rent

#### Scenario: A running tenancy

- **WHEN** an owner retrieves a lease running with more than fourteen days of its term left
- **THEN** its status is reported as active

#### Scenario: A tenancy ending within two weeks

- **WHEN** a running lease's term ends in fourteen days or fewer
- **THEN** its status is reported as due soon

#### Scenario: A tenancy whose term has run out

- **WHEN** a lease's agreed term has ended and no move-out is recorded
- **THEN** its status is reported as overdue

#### Scenario: A tenancy that has not started

- **WHEN** a lease's start date is still in the future
- **THEN** its status is reported as upcoming, whatever its term

#### Scenario: A closed tenancy

- **WHEN** a lease has recorded a move-out
- **THEN** its status is reported as finalized, whether or not its term had ended

#### Scenario: A cancelled tenancy

- **WHEN** a lease has been cancelled
- **THEN** its status is reported as cancelled, and neither its term nor its start date changes that

#### Scenario: The expected end is reported

- **WHEN** an owner retrieves a lease
- **THEN** its expected end date is reported alongside its status

## ADDED Requirements

### Requirement: Owner can list leases by status, in the order they need attention

The system SHALL allow an authenticated `owner` to retrieve a lease by id and to list leases filtered by room, by building, by the people who have occupied them, and BY STATUS. Listing SHALL use the shared paginated response contract.

Filtering by building exists because a room code identifies a room only within its building, so an owner holding several buildings cannot pick a room without first knowing which building it is in.

**Leases SHALL be ordered by what needs doing**, not by when they were signed:

1. overdue
2. dueSoon
3. active
4. upcoming
5. finalized
6. cancelled

Within the first three, the one with the LEAST time left SHALL come first — an overdue tenancy that ran out a month ago before one that ran out yesterday, and a running one ending on Friday before one ending next year. Those three are a single sequence by end date, which is what "least time left" means once the groups are in that order.

Within every other group, the most recently signed SHALL come first.

The order SHALL be total, with the record's id deciding where every other key ties, so no lease can move between pages as pages are fetched.

Ordering SHALL be applied by the system. The response is one page of a larger set, so a page ordered after it arrives is the wrong rows in the wrong order.

#### Scenario: Overdue tenancies come first

- **WHEN** an owner lists leases without naming a status
- **THEN** every overdue lease appears before every due-soon one, which appear before every running one

#### Scenario: Least time left first

- **WHEN** two running leases end on different days
- **THEN** the one ending sooner is listed first

#### Scenario: The closed and cancelled sink

- **WHEN** the list contains finalized and cancelled leases
- **THEN** they appear after every lease that has not ended, cancelled last

#### Scenario: Most recently signed within a group

- **WHEN** two finalized leases are listed
- **THEN** the more recently signed comes first

#### Scenario: Filtering by status

- **WHEN** an owner lists leases filtered to one status
- **THEN** only leases in that state are listed

#### Scenario: Filtering combines with the others

- **WHEN** an owner filters by building and by status
- **THEN** only leases of that status in that building are listed

#### Scenario: The order is total

- **WHEN** two leases tie on every key of the order
- **THEN** their relative order is decided by id and does not change between requests

#### Scenario: Listing is paginated

- **WHEN** an owner lists leases
- **THEN** the response is the shared paginated shape, with the leases in `data` and the page, page size and totals in `meta`
