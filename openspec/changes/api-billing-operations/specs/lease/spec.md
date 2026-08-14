## MODIFIED Requirements

### Requirement: Owner can create a lease
The system SHALL allow an authenticated `owner` to create a lease for an existing active room, naming an existing customer as the lease signatory and recording a start date, an agreed duration in whole months, an occupant count, and the electricity meter reading the tenancy starts from. Duration and occupant count MUST both be at least 1. Creating the lease SHALL also record the signatory as the lease's primary occupant, and the two SHALL be created together so a lease never exists without one. The starting meter reading SHALL default to the closing reading of the room's most recent finalized lease and MAY be overridden by the owner, so that electricity consumed while the room stood empty is not charged to the incoming tenant. Where the room has no previous lease, the reading MUST be supplied.

#### Scenario: Successful creation
- **WHEN** an authenticated owner creates a lease for an active, unoccupied room naming an existing customer as signatory, with a valid start date, duration, occupant count, and starting meter reading
- **THEN** the system creates the lease as active, records the signatory as its primary occupant, and responds with HTTP 201 and the created lease

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
