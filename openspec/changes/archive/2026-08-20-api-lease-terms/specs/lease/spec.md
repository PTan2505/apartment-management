## MODIFIED Requirements

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

### Requirement: Lease status, expected end date, and tenant are derived
The system SHALL derive a lease's expected end date from its start date and agreed duration, its status from whether a move-out date is recorded, its tenant from the current primary occupant, and its deposit amount from the agreed rent and the number of deposit months. None of these SHALL be independently settable, so they can never contradict the records they come from.

The deposit amount SHALL be reported alongside the number of months it was agreed in, so that a caller can show either without computing it. It SHALL follow the lease's own agreed rent rather than the room's current rent, because the deposit was agreed against the rent in the lease.

#### Scenario: Expected end date reflects start date and duration
- **WHEN** an authenticated owner retrieves a lease starting 2026-01-15 with an agreed duration of 12 months
- **THEN** the response reports an expected end date of 2027-01-15

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
