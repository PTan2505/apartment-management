## MODIFIED Requirements

### Requirement: Owner can create a lease
The system SHALL allow an authenticated `owner` to create a lease for an existing active room, naming an existing customer as the lease signatory and recording a start date, an agreed duration in whole months, an occupant count, the electricity meter reading the tenancy starts from, the agreed monthly rent, and the deposit expressed in months of rent. Duration and occupant count MUST both be at least 1. Creating the lease SHALL also record the signatory as the lease's primary occupant, and SHALL issue the lease's move-in invoice charging its deposit and its first month's rent. All three SHALL be created together, so a lease never exists without someone responsible for it or without the bill that starts it. The starting meter reading SHALL default to the room's latest known meter reading — the most recent of its previous lease's closing reading and any vacancy reading recorded since — and MAY be overridden by the owner, so that electricity consumed while the room stood empty is not charged to the incoming tenant. Where the room has no previous lease, the reading MUST be supplied.

The agreed rent SHALL default to the room's base rent at the moment the lease is created, and MAY be overridden, so that rent negotiated with a particular tenant can be recorded without changing what the room asks of everyone else. It MUST NOT be negative.

The deposit SHALL be recorded as a whole number of months of the agreed rent, because that is how it is agreed. It SHALL default to the building's default deposit months, and MAY be overridden by the owner, so that a deposit waived or doubled for a particular tenant is recorded without changing what the building asks of everyone else. It MUST NOT be negative. Zero SHALL be accepted, for a lease taken without a deposit — an agreement with no deposit and an agreement whose deposit was never recorded SHALL NOT be indistinguishable, which is why the value omitted now resolves to a number the building states rather than to nothing.

#### Scenario: Successful creation
- **WHEN** an authenticated owner creates a lease for an active, unoccupied room naming an existing customer as signatory, with a valid start date, duration, occupant count, starting meter reading, and deposit
- **THEN** the system creates the lease as active, records the signatory as its primary occupant, issues its move-in invoice, and responds with HTTP 201 and the created lease

#### Scenario: Creating a lease issues its opening bill
- **WHEN** an authenticated owner creates a lease
- **THEN** a move-in invoice exists for it, charging the deposit agreed and the rent for the month the tenancy begins

#### Scenario: A lease is not left without its opening bill
- **WHEN** issuing the move-in invoice fails while a lease is being created
- **THEN** no lease, occupant record or invoice is created

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
- **THEN** the lease records the deposit months its building defaults to

#### Scenario: Owner agrees a deposit other than the building's
- **WHEN** an authenticated owner creates a lease supplying a number of deposit months different from the building's default
- **THEN** the lease records the supplied number, and the building's default is unchanged

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
