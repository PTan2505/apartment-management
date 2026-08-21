## MODIFIED Requirements

### Requirement: A room has at most one active lease
The system SHALL reject a new lease for a room that already has an active lease. Once the existing lease records a move-out, the room SHALL accept a new lease, and the previous lease SHALL be retained as history.

The system SHALL further reject a new lease whose start date falls before the most recent tenancy on that room ended, so that no day is covered by two leases at once. Because an ending date is the first day no longer covered, a new lease MAY begin on exactly the date the previous one ended, and no earlier — the two then meet with neither a gap nor an overlap.

A start date later than the previous tenancy's end SHALL be accepted. A room may stand empty between tenancies, and the days in between belong to nobody rather than being an error.

No other constraint SHALL be placed on the start date. A tenancy may begin on any day of any month; only overlapping a previous tenancy is refused.

#### Scenario: Room already has an active lease
- **WHEN** an authenticated owner creates a lease for a room whose existing lease has no move-out date
- **THEN** the system responds with HTTP 409 and does not create the lease

#### Scenario: Re-letting a room after move-out
- **WHEN** an authenticated owner creates a lease for a room whose previous lease has recorded a move-out, starting on or after that date
- **THEN** the system creates the new lease successfully and the previous lease remains unchanged as history

#### Scenario: A new lease beginning on the date the previous one ended
- **WHEN** an authenticated owner creates a lease starting on exactly the date the room's previous lease recorded as its move-out
- **THEN** the system creates it, because that date is the first day the previous tenancy no longer covers

#### Scenario: A new lease overlapping the previous tenancy
- **WHEN** an authenticated owner creates a lease for a room, starting before the date the previous lease recorded as its move-out
- **THEN** the system responds with HTTP 409 and does not create the lease, because both tenancies would be billed for the same days

#### Scenario: A gap between tenancies is allowed
- **WHEN** an authenticated owner creates a lease starting well after the room's previous lease ended
- **THEN** the system creates it, because a room may stand empty between tenancies

#### Scenario: A tenancy may begin on any day of the month
- **WHEN** an authenticated owner creates a lease starting partway through a month, not overlapping any previous tenancy on that room
- **THEN** the system creates it

#### Scenario: The check considers the room's most recent tenancy
- **WHEN** a room has been let several times and an authenticated owner creates a lease starting before the latest of those ended
- **THEN** the system responds with HTTP 409, even where the start date falls after some earlier tenancy ended

#### Scenario: A room's first lease has nothing to overlap
- **WHEN** an authenticated owner creates the first lease a room has ever had
- **THEN** the system creates it whatever its start date

#### Scenario: Room accumulates lease history
- **WHEN** an authenticated owner lists the leases for a room that has been let several times
- **THEN** the response includes every past lease along with the current one

### Requirement: Owner can list, filter, and retrieve leases
The system SHALL allow an authenticated `owner` to retrieve a lease by id and to list leases filtered by room, by the people who have occupied them, by whether they are active, and by whether their agreed term has run out without a move-out being recorded. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

A lease whose term has ended while no move-out is recorded SHALL be findable, because it needs attention: no further invoice can be issued for it, and its room stays held against a new tenancy until it is closed or renewed. Leaving such a lease discoverable only by inspecting each room in turn would make a state the system creates a state the owner cannot act on.

This filter SHALL be combinable with the others, and SHALL be judged against the same exclusive reading of the term as billing uses.

#### Scenario: Filtering to active leases
- **WHEN** an authenticated owner lists leases filtered to active ones
- **THEN** the response contains only leases with no move-out date

#### Scenario: Filtering to leases whose term has run out
- **WHEN** an authenticated owner lists leases filtered to those whose term has ended without a move-out
- **THEN** the response contains only leases with no move-out date whose agreed term has already ended

#### Scenario: A lease still within its term is not listed as overdue
- **WHEN** an authenticated owner filters to overdue leases and a lease with no move-out is still inside its agreed term
- **THEN** that lease is not included

#### Scenario: A closed lease is not listed as overdue
- **WHEN** an authenticated owner filters to overdue leases and a lease whose term ended has since recorded a move-out
- **THEN** that lease is not included, because it needs no attention

#### Scenario: The overdue filter combines with the others
- **WHEN** an authenticated owner filters to overdue leases within a particular room
- **THEN** the response contains only that room's leases matching both conditions

#### Scenario: Filtering by person
- **WHEN** an authenticated owner lists leases filtered by a customer id
- **THEN** the response contains every lease that person has occupied, whether as primary occupant or not, including finalized ones

#### Scenario: Retrieving a lease that does not exist
- **WHEN** an authenticated owner requests a lease id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Lease listing is paginated
- **WHEN** an authenticated owner lists leases
- **THEN** the response is the shared paginated shape, with the leases in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to filtered leases
- **WHEN** an authenticated owner lists leases filtered to active ones and asks for a specific page
- **THEN** the items and totals describe only the active leases
