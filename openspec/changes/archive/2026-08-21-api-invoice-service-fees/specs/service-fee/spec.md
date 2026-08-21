## MODIFIED Requirements

### Requirement: A lease agrees to fees at the price current when it selects them
The system SHALL allow an authenticated `owner` to add one of a building's fees to a lease on that building's room, recording a quantity and the date the fee begins applying, and to list a lease's fees.

The unit amount SHALL be copied from the building's fee at the moment it is selected, and SHALL be what that lease is charged for the rest of its term. Changing the building's fee afterwards SHALL NOT change what any lease that already selected it pays — a lease keeps the terms it agreed, as it already does for its rent.

A quantity MUST be at least one. It SHALL default to one where not supplied, because a fee that is simply either taken or not — internet, rubbish — is the same thing as a fee taken once, and should not require the owner to say so.

The date a fee begins applying SHALL default to the lease's start date, which is when a fee agreed at signing began. It MAY be supplied, for a service taken up partway through a tenancy. It MUST NOT precede the lease's start date, because a fee cannot apply before the tenancy it belongs to.

A lease SHALL NOT select a fee belonging to a different building than its room, and SHALL NOT hold the same fee twice **at the same time** — a second motorbike is a quantity of two, not two selections. A fee that has been given up MAY be taken again later, and the two periods SHALL both be retained.

A lease SHALL NOT select a retired fee.

Listing a lease's fees SHALL report, for each, the fee it came from, the unit amount agreed, the quantity, the period it applies for, and the resulting monthly amount. That amount SHALL be derived from the agreed unit amount and the quantity rather than stored, so it cannot contradict them.

#### Scenario: Selecting a fee
- **WHEN** an authenticated owner adds one of the building's fees to a lease with a quantity of two
- **THEN** the system responds with HTTP 201, recording the building fee's current unit amount and a quantity of two

#### Scenario: Quantity defaults to one
- **WHEN** an authenticated owner adds a fee to a lease without supplying a quantity
- **THEN** the lease records a quantity of one

#### Scenario: The start of a fee defaults to the lease start
- **WHEN** an authenticated owner adds a fee to a lease without supplying a date it begins applying
- **THEN** the fee is recorded as applying from the lease's start date

#### Scenario: A fee taken up partway through a tenancy
- **WHEN** an authenticated owner adds a fee supplying a date later than the lease's start date
- **THEN** the fee is recorded as applying from that date

#### Scenario: A fee cannot begin before its lease
- **WHEN** an authenticated owner adds a fee supplying a date earlier than the lease's start date
- **THEN** the system responds with HTTP 400 and records nothing

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
- **WHEN** an authenticated owner adds a fee the lease currently holds
- **THEN** the system responds with HTTP 409, because using more of a service is a quantity rather than a second selection held at the same time

#### Scenario: Taking a fee again after giving it up
- **WHEN** an authenticated owner adds a fee that this lease previously gave up
- **THEN** the system records it as a new period, and the earlier period is retained

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
The system SHALL allow an authenticated `owner` to change the quantity of a fee a lease has selected, and to record that a lease has given up a fee, while the lease is running.

Changing a quantity SHALL NOT change the agreed unit amount, even when the building's fee has since been repriced. The unit amount is a term the agreement settled; the quantity is a fact about what the tenant uses, and correcting one MUST NOT silently rewrite the other.

Adding a fee to a running lease SHALL record the unit amount current at that moment, because nothing about that fee was agreed when the lease began.

Giving up a fee SHALL record the date it stopped applying rather than removing the record. A tenant who had parking for half of March had it, and an invoice generated afterwards must be able to charge for those days — deleting the record would make that unanswerable and would silently charge nothing. The date SHALL default to today and MAY be supplied. It MUST NOT precede the date the fee began applying.

A fee that has been given up SHALL no longer be charged for days after that date, and SHALL still be reported as part of the lease's history.

#### Scenario: A tenant acquires a second motorbike
- **WHEN** an authenticated owner changes a lease's parking quantity from one to two, after the building's parking fee was repriced
- **THEN** the lease reports a quantity of two at the unit amount it originally agreed, and the monthly amount is that unit amount doubled

#### Scenario: A tenant takes a service mid-tenancy
- **WHEN** an authenticated owner adds a fee to a running lease that did not previously have it
- **THEN** the lease records the fee at the building's current unit amount

#### Scenario: A tenant gives up a service
- **WHEN** an authenticated owner records that a lease has given up a fee
- **THEN** the fee stops applying from that date and the record is retained rather than deleted

#### Scenario: A given-up fee remains in the lease's history
- **WHEN** an authenticated owner lists a lease's fees after one has been given up
- **THEN** that fee is still reported, with the period it applied for

#### Scenario: A fee cannot stop before it started
- **WHEN** an authenticated owner records a fee as given up on a date earlier than the date it began applying
- **THEN** the system responds with HTTP 400 and the record is unchanged

#### Scenario: Quantity below one on a change
- **WHEN** an authenticated owner changes a quantity to below one
- **THEN** the system responds with HTTP 400 and the existing quantity is unchanged
