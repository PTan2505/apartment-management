## Purpose

Covers what a building charges a tenant for beyond rent and metered utilities — parking, internet, rubbish, shared cleaning — and which of those charges each lease agreed to, at what price, and in what quantity.

## ADDED Requirements

### Requirement: Owner can define what a building charges for

The system SHALL allow an authenticated `owner` to add a service fee to a building, recording a name and a unit amount, and to list a building's fees.

The name MUST NOT be empty, and the unit amount MUST NOT be negative. Zero SHALL be accepted, for a service offered at no charge.

A name SHALL NOT be duplicated among a building's fees that are still offered, because two entries called "Parking" in one building cannot be told apart when selecting one. A retired fee's name SHALL become available again, and the same name MAY exist in different buildings.

Listing SHALL be paginated using the shared paginated response contract.

#### Scenario: Adding a fee

- **WHEN** an authenticated owner adds a fee to a building with a name and a unit amount
- **THEN** the system responds with HTTP 201 and the created fee

#### Scenario: Listing a building's fees

- **WHEN** an authenticated owner lists a building's fees
- **THEN** the response contains the fees defined for that building and no others

#### Scenario: A fee offered at no charge

- **WHEN** an authenticated owner adds a fee with a unit amount of zero
- **THEN** the system creates it

#### Scenario: Negative unit amount

- **WHEN** an authenticated owner submits a negative unit amount
- **THEN** the system responds with HTTP 400 and does not create the fee

#### Scenario: Missing name

- **WHEN** an authenticated owner submits a fee without a name
- **THEN** the system responds with HTTP 400 and does not create the fee

#### Scenario: Duplicate name in the same building

- **WHEN** an authenticated owner adds a fee whose name matches one still offered in that building
- **THEN** the system responds with HTTP 409 and does not create the fee

#### Scenario: The same name in a different building

- **WHEN** an authenticated owner adds a fee whose name matches one in a different building
- **THEN** the system creates it

#### Scenario: Building does not exist

- **WHEN** an authenticated owner adds a fee to a building id that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: Owner can correct a fee and take it out of use

The system SHALL allow an authenticated `owner` to change a fee's name and unit amount, and to retire and restore it. The system SHALL NOT support deleting a fee, so that leases which recorded where their charge came from keep that reference.

A retired fee SHALL NOT be selectable by a lease. Retiring SHALL leave every lease that already selected it entirely unaffected, because a lease holds its own copy of the amount — a retired fee changes what may be agreed next, not what was already agreed.

Restoring SHALL be refused when another fee still offered in that building has since taken the name, for the same reason a duplicate name is refused in the first place.

#### Scenario: Changing a fee's unit amount

- **WHEN** an authenticated owner changes a fee's unit amount
- **THEN** the change is saved and applies to selections made afterwards

#### Scenario: Retiring a fee

- **WHEN** an authenticated owner retires a fee
- **THEN** it is excluded from the fees a lease may select, and its record still exists

#### Scenario: A running lease is unaffected by retiring a fee

- **WHEN** an authenticated owner retires a fee that an active lease had already selected
- **THEN** that lease still carries the fee, at the amount it agreed

#### Scenario: Restoring a fee

- **WHEN** an authenticated owner restores a retired fee whose name is not in use by another fee still offered in that building
- **THEN** it is offered again

#### Scenario: Restoring a fee whose name was reused

- **WHEN** an authenticated owner restores a retired fee whose name is now used by another fee still offered in that building
- **THEN** the system responds with HTTP 409 and the fee remains retired

#### Scenario: Fee does not exist

- **WHEN** an authenticated owner changes a fee id that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: A lease agrees to fees at the price current when it selects them

The system SHALL allow an authenticated `owner` to add one of a building's fees to a lease on that building's room, recording a quantity, and to list a lease's fees.

The unit amount SHALL be copied from the building's fee at the moment it is selected, and SHALL be what that lease is charged for the rest of its term. Changing the building's fee afterwards SHALL NOT change what any lease that already selected it pays — a lease keeps the terms it agreed, as it already does for its rent.

A quantity MUST be at least one. It SHALL default to one where not supplied, because a fee that is simply either taken or not — internet, rubbish — is the same thing as a fee taken once, and should not require the owner to say so.

A lease SHALL NOT select a fee belonging to a different building than its room, and SHALL NOT select the same fee twice — a second motorbike is a quantity of two, not two selections.

A lease SHALL NOT select a retired fee.

Listing a lease's fees SHALL report, for each, the fee it came from, the unit amount agreed, the quantity, and the resulting monthly amount. That amount SHALL be derived from the agreed unit amount and the quantity rather than stored, so it cannot contradict them.

#### Scenario: Selecting a fee

- **WHEN** an authenticated owner adds one of the building's fees to a lease with a quantity of two
- **THEN** the system responds with HTTP 201, recording the building fee's current unit amount and a quantity of two

#### Scenario: Quantity defaults to one

- **WHEN** an authenticated owner adds a fee to a lease without supplying a quantity
- **THEN** the lease records a quantity of one

#### Scenario: The agreed amount survives a later price change

- **WHEN** a building's fee has its unit amount changed after a lease selected it
- **THEN** that lease still reports the unit amount it agreed

#### Scenario: A later lease picks up the changed price

- **WHEN** a building's fee has its unit amount changed and another lease then selects it
- **THEN** that lease records the changed amount

#### Scenario: Monthly amount is derived

- **WHEN** an authenticated owner lists a lease's fees, and one was agreed at 100,000 with a quantity of two
- **THEN** that fee reports a monthly amount of 200,000

#### Scenario: Quantity below one

- **WHEN** an authenticated owner supplies a quantity below one
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: Selecting the same fee twice

- **WHEN** an authenticated owner adds a fee that the lease has already selected
- **THEN** the system responds with HTTP 409, because using more of a service is a quantity rather than a second selection

#### Scenario: Selecting a fee from another building

- **WHEN** an authenticated owner adds a fee belonging to a building other than the one the lease's room is in
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: Selecting a retired fee

- **WHEN** an authenticated owner adds a fee that has been retired
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: Lease does not exist

- **WHEN** an authenticated owner adds a fee to a lease id that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: Owner can change what a running lease uses

The system SHALL allow an authenticated `owner` to change the quantity of a fee a lease has selected, and to remove a fee from a lease, while the lease is running.

Changing a quantity SHALL NOT change the agreed unit amount, even when the building's fee has since been repriced. The unit amount is a term the agreement settled; the quantity is a fact about what the tenant uses, and correcting one MUST NOT silently rewrite the other.

Adding a fee to a running lease SHALL record the unit amount current at that moment, because nothing about that fee was agreed when the lease began.

#### Scenario: A tenant acquires a second motorbike

- **WHEN** an authenticated owner changes a lease's parking quantity from one to two, after the building's parking fee was repriced
- **THEN** the lease reports a quantity of two at the unit amount it originally agreed, and the monthly amount is that unit amount doubled

#### Scenario: A tenant takes a service mid-tenancy

- **WHEN** an authenticated owner adds a fee to a running lease that did not previously have it
- **THEN** the lease records the fee at the building's current unit amount

#### Scenario: A tenant gives up a service

- **WHEN** an authenticated owner removes a fee from a lease
- **THEN** the lease no longer carries that fee

#### Scenario: Quantity below one on a change

- **WHEN** an authenticated owner changes a quantity to below one
- **THEN** the system responds with HTTP 400 and the existing quantity is unchanged

### Requirement: Service fee endpoints require an authenticated owner

The system SHALL reject any service fee request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request

- **WHEN** a request to any service fee endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request

- **WHEN** a request to any service fee endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
