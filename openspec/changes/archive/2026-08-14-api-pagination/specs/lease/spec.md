## MODIFIED Requirements

### Requirement: Owner can list, filter, and retrieve leases
The system SHALL allow an authenticated `owner` to retrieve a lease by id and to list leases filtered by room, by the people who have occupied them, and by whether they are active. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

#### Scenario: Filtering to active leases
- **WHEN** an authenticated owner lists leases filtered to active ones
- **THEN** the response contains only leases with no move-out date

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

### Requirement: Owner can manage the occupants of a lease
The system SHALL allow an authenticated `owner` to add a person as an occupant of a lease, to record the date an occupant left, and to list a lease's occupants including those who have departed. Each occupant record SHALL carry the date the person joined and, once they leave, the date they departed. Listing occupants SHALL be paginated using the shared paginated response contract.

#### Scenario: Adding an occupant
- **WHEN** an authenticated owner adds an existing customer as an occupant of an active lease
- **THEN** the system records the occupant with a joined date and responds with HTTP 201

#### Scenario: Recording that an occupant left
- **WHEN** an authenticated owner records a departure date for a current occupant
- **THEN** the occupant is reported as departed and remains listed in the lease's occupant history

#### Scenario: Listing occupants includes those who left
- **WHEN** an authenticated owner lists the occupants of a lease that some people have since left
- **THEN** the response includes both current and departed occupants, each with their joined and departure dates

#### Scenario: Adding a person who does not exist
- **WHEN** an authenticated owner adds an occupant referencing a customer id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Adding the same person twice
- **WHEN** an authenticated owner adds a person who is already a current occupant of that lease
- **THEN** the system responds with HTTP 409 and does not create a second record

#### Scenario: Re-adding a person who previously left
- **WHEN** an authenticated owner adds a person who was an occupant of that lease but has since departed
- **THEN** the system creates a new occupant record and the earlier departed record is retained

#### Scenario: Departure date before the joined date
- **WHEN** an authenticated owner records a departure date earlier than the date that occupant joined
- **THEN** the system responds with HTTP 400 and the occupant remains current

#### Scenario: Following a person between rooms
- **WHEN** a person is recorded as departed from one lease and added as an occupant of another lease
- **THEN** both records refer to the same customer, so the owner can see where that person lived and when

#### Scenario: Occupant listing is paginated
- **WHEN** an authenticated owner lists the occupants of a lease
- **THEN** the response is the shared paginated shape, with the occupants in `data` and the page, page size, and totals in `meta`
