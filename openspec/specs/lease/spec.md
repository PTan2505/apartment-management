## Purpose

Tracks rental agreements that bind people to a room for an agreed period, recording who signed the lease, who lives under it over time, how many occupants utilities are billed for, and when the tenant actually moved out.

## Requirements

### Requirement: Owner can create a lease
The system SHALL allow an authenticated `owner` to create a lease for an existing active room, naming an existing customer as the lease signatory and recording a start date, an agreed duration in whole months, an occupant count, the electricity meter reading the tenancy starts from, the agreed monthly rent, and the deposit expressed in months of rent. Duration and occupant count MUST both be at least 1. Creating the lease SHALL also record the signatory as the lease's primary occupant, and the two SHALL be created together so a lease never exists without one. The starting meter reading SHALL default to the room's latest known meter reading — the most recent of its previous lease's closing reading and any vacancy reading recorded since — and MAY be overridden by the owner, so that electricity consumed while the room stood empty is not charged to the incoming tenant. Where the room has no previous lease, the reading MUST be supplied.

The agreed rent SHALL default to the room's base rent at the moment the lease is created, and MAY be overridden, so that rent negotiated with a particular tenant can be recorded without changing what the room asks of everyone else. It MUST NOT be negative.

The deposit SHALL be recorded as a whole number of months of the agreed rent, because that is how it is agreed. It MUST be supplied and MUST NOT be negative. Zero SHALL be accepted, for a lease taken without a deposit — an agreement with no deposit and an agreement whose deposit was never recorded SHALL NOT be indistinguishable.

#### Scenario: Successful creation
- **WHEN** an authenticated owner creates a lease for an active, unoccupied room naming an existing customer as signatory, with a valid start date, duration, occupant count, starting meter reading, and deposit
- **THEN** the system creates the lease as active, records the signatory as its primary occupant, and responds with HTTP 201 and the created lease

#### Scenario: Agreed rent defaults to the room's rent
- **WHEN** an authenticated owner creates a lease without supplying an agreed rent
- **THEN** the lease records the room's base rent as it stood at that moment

#### Scenario: Owner negotiates a different rent
- **WHEN** an authenticated owner creates a lease supplying an agreed rent different from the room's base rent
- **THEN** the lease records the supplied rent, and the room's base rent is unchanged

#### Scenario: Negative agreed rent
- **WHEN** an authenticated owner supplies a negative agreed rent
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Deposit recorded in months
- **WHEN** an authenticated owner creates a lease with a deposit of two months
- **THEN** the lease records a deposit of two months

#### Scenario: A lease taken without a deposit
- **WHEN** an authenticated owner creates a lease with a deposit of zero months
- **THEN** the system creates the lease and records the deposit as zero

#### Scenario: Missing deposit
- **WHEN** an authenticated owner creates a lease without supplying a deposit
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Negative deposit
- **WHEN** an authenticated owner supplies a negative number of deposit months
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Starting reading defaults to the previous tenancy's closing reading
- **WHEN** an authenticated owner creates a lease for a room whose previous lease recorded a closing meter reading, without supplying a starting reading
- **THEN** the lease starts from that closing reading

#### Scenario: Owner overrides the starting reading after a vacancy
- **WHEN** an authenticated owner creates a lease supplying a starting meter reading higher than the previous lease's closing reading, because the meter advanced while the room was empty
- **THEN** the system records the supplied reading, so the incoming tenant is not charged for consumption from the vacant period

#### Scenario: Room has no previous lease
- **WHEN** an authenticated owner creates the first lease for a room without supplying a starting meter reading
- **THEN** the system responds with HTTP 400, because there is no previous reading to fall back on and assuming zero would charge the tenant for the meter's whole history

#### Scenario: Meter was replaced between tenancies
- **WHEN** an authenticated owner creates a lease supplying a starting meter reading lower than the previous lease's closing reading, because the meter was replaced
- **THEN** the system records the supplied reading as the new baseline

#### Scenario: Negative starting meter reading
- **WHEN** an authenticated owner supplies a negative starting meter reading
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Signatory does not exist
- **WHEN** an authenticated owner creates a lease naming a customer id that does not exist
- **THEN** the system responds with HTTP 404 and creates neither the lease nor an occupant record

#### Scenario: Room does not exist
- **WHEN** an authenticated owner creates a lease referencing a room id that does not exist
- **THEN** the system responds with HTTP 404 and does not create the lease

#### Scenario: Room is retired
- **WHEN** an authenticated owner creates a lease for a room that has been retired
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Invalid duration or occupant count
- **WHEN** an authenticated owner submits a duration or occupant count below 1
- **THEN** the system responds with HTTP 400 and does not create the lease

#### Scenario: Signatory has no phone number
- **WHEN** an authenticated owner creates a lease naming a customer who has no phone number recorded
- **THEN** the system responds with HTTP 400, because the person responsible for the agreement must be contactable

#### Scenario: Default follows a vacancy reading recorded after the previous tenancy
- **WHEN** an authenticated owner creates a lease for a room whose vacancy electricity was recorded after its previous lease ended, without supplying a starting reading
- **THEN** the lease starts from the most recent vacancy reading rather than the previous lease's closing reading, because the owner has already paid for the consumption in between

### Requirement: A room has at most one active lease
The system SHALL reject a new lease for a room that already has an active lease. Once the existing lease records a move-out, the room SHALL accept a new lease, and the previous lease SHALL be retained as history.

#### Scenario: Room already has an active lease
- **WHEN** an authenticated owner creates a lease for a room whose existing lease has no move-out date
- **THEN** the system responds with HTTP 409 and does not create the lease

#### Scenario: Re-letting a room after move-out
- **WHEN** an authenticated owner creates a lease for a room whose previous lease has recorded a move-out
- **THEN** the system creates the new lease successfully and the previous lease remains unchanged as history

#### Scenario: Room accumulates lease history
- **WHEN** an authenticated owner lists the leases for a room that has been let several times
- **THEN** the response includes every past lease along with the current one

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
### Requirement: A lease has one primary occupant at a time
The system SHALL treat exactly one current occupant as the lease's primary occupant — the person responsible for the agreement — and SHALL allow that responsibility to be transferred to another current occupant without losing the record of who held it before.

#### Scenario: The signatory is the primary occupant
- **WHEN** an authenticated owner retrieves the occupants of a newly created lease
- **THEN** the person named as signatory is marked as the primary occupant

#### Scenario: Transferring responsibility to another occupant
- **WHEN** an authenticated owner transfers primary responsibility to another current occupant of the lease
- **THEN** that person becomes the primary occupant, the previous primary remains a current occupant, and the record of who was previously primary is retained

#### Scenario: Transferring to someone who is not an occupant
- **WHEN** an authenticated owner transfers primary responsibility to a person who is not a current occupant of that lease
- **THEN** the system responds with HTTP 400 and the primary occupant is unchanged

#### Scenario: Removing the primary occupant
- **WHEN** an authenticated owner records a departure date for the occupant who is currently primary, while other occupants remain
- **THEN** the system responds with HTTP 409, because responsibility must be transferred to another occupant first

#### Scenario: The primary occupant is the last one to leave
- **WHEN** an authenticated owner records a departure date for the primary occupant and no other current occupants remain
- **THEN** the system accepts the departure, because there is nobody to transfer responsibility to, and the lease reports no tenant until a move-out is recorded

### Requirement: Occupant count is maintained separately from occupant records
The system SHALL treat the lease's occupant count as a manually maintained number that is authoritative for utility billing, and SHALL NOT derive it from the recorded occupants. An owner may know how many people live in a room while holding details for only some of them, so the two figures MAY differ and the system SHALL NOT reconcile them automatically.

#### Scenario: Occupant count differs from recorded occupants
- **WHEN** a lease has an occupant count of 5 but only 2 people recorded as occupants
- **THEN** the system accepts both values and reports the occupant count as 5

#### Scenario: Adding an occupant does not change the occupant count
- **WHEN** an authenticated owner adds a person as an occupant of a lease
- **THEN** the lease's occupant count is unchanged

#### Scenario: Recording a departure does not change the occupant count
- **WHEN** an authenticated owner records a departure date for an occupant
- **THEN** the lease's occupant count is unchanged

### Requirement: Lease status, expected end date, and tenant are derived
The system SHALL derive a lease's expected end date from its start date and agreed duration, its status from whether a move-out date is recorded, its tenant from the current primary occupant, and its deposit amount from the agreed rent and the number of deposit months. None of these SHALL be independently settable, so they can never contradict the records they come from.

A date that ends a tenancy SHALL be **exclusive**: it is the first day the tenancy no longer covers, and the last day covered is the day before it. This SHALL hold for both the expected end date and the move-out date, so that a reader never has to remember which of them counts its own day and which does not.

A lease beginning 1 January for six months therefore has an expected end date of 1 July and covers through 30 June. A lease whose move-out is recorded as 5 July covers through 4 July. In both cases a new lease beginning on that same date follows with neither a gap nor an overlap.

The expected end date SHALL NOT constrain the move-out date. It states when the agreement ends, not when the tenant left — a tenant may stay past it without either party wanting a renewal, and the record SHALL be able to say so.

The deposit amount SHALL be reported alongside the number of months it was agreed in, so that a caller can show either without computing it. It SHALL follow the lease's own agreed rent rather than the room's current rent, because the deposit was agreed against the rent in the lease.

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
- **WHEN** an authenticated owner retrieves a lease that has no move-out date
- **THEN** the response reports the lease as active

#### Scenario: Lease with a move-out date is finalized
- **WHEN** an authenticated owner retrieves a lease that has a move-out date
- **THEN** the response reports the lease as finalized

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

### Requirement: Owner can record a move-out
The system SHALL allow an authenticated `owner` to record the date a tenant actually moved out together with the electricity meter reading taken at handover, which finalizes the lease and frees the room for a new one. The move-out date MUST NOT precede the lease start date. The closing meter reading MUST NOT be lower than the lease's starting reading, nor lower than the closing reading of that lease's most recent invoice. Finalizing a lease SHALL also mark its current occupants as departed on that date, so nobody is left recorded as living in a room that is no longer let. The closing reading SHALL both close the outgoing tenancy's electricity and provide the default starting point for the room's next lease.

#### Scenario: Recording a move-out
- **WHEN** an authenticated owner records a move-out date and closing meter reading on an active lease
- **THEN** the lease is reported as finalized, the closing reading is retained, and the room becomes available for a new lease

#### Scenario: Move-out closes the occupancy records
- **WHEN** an authenticated owner records a move-out date on a lease that has current occupants
- **THEN** those occupants are recorded as having departed on that date

#### Scenario: Closing reading below the lease's starting reading
- **WHEN** an authenticated owner records a closing meter reading lower than the reading the lease started from
- **THEN** the system responds with HTTP 400 and the lease remains active

#### Scenario: Closing reading below an already invoiced reading
- **WHEN** an authenticated owner records a closing meter reading lower than the closing reading of that lease's most recent invoice
- **THEN** the system responds with HTTP 400, because the tenancy has already been billed past that point

#### Scenario: Move-out before the start date
- **WHEN** an authenticated owner records a move-out date earlier than the lease's start date
- **THEN** the system responds with HTTP 400 and the lease remains active

#### Scenario: Move-out on an already finalized lease
- **WHEN** an authenticated owner records a move-out on a lease that already has a move-out date
- **THEN** the system responds with HTTP 409 and the original move-out date is unchanged

#### Scenario: Move-out may precede the expected end date
- **WHEN** an authenticated owner records a move-out date earlier than the lease's expected end date
- **THEN** the system accepts it and finalizes the lease, because tenants may leave before their agreed term ends
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
### Requirement: Owner can update lease terms
The system SHALL allow an authenticated `owner` to update an active lease's occupant count and agreed duration. Changing the occupant count SHALL NOT alter any invoice already issued, because each invoice records the count it billed.

#### Scenario: Updating the occupant count
- **WHEN** an authenticated owner updates the occupant count on an active lease
- **THEN** the system saves the change and responds with HTTP 200 and the updated lease

#### Scenario: Updating a finalized lease
- **WHEN** an authenticated owner updates a lease that has already recorded a move-out
- **THEN** the system responds with HTTP 409 and does not apply the change

#### Scenario: Occupant count below one
- **WHEN** an authenticated owner updates a lease's occupant count to less than 1
- **THEN** the system responds with HTTP 400 and does not apply the change

### Requirement: Lease endpoints require an authenticated owner
The system SHALL reject any lease or lease-occupant request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any lease endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any lease endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
