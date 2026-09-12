## ADDED Requirements

### Requirement: A person occupies at most one room at a time

The API SHALL refuse to record somebody as an occupant of a room while they are already a current occupant of another room, whether they are being made the signatory of a new tenancy or added to an existing one.

Occupant counts drive the electricity and water split, so a person counted in two rooms is billed twice for utilities they used once. The revenue report names the person responsible for a room, and would name one person for two. Neither shows as an error: each room reads correctly on its own, and only a reader comparing rooms would ever notice.

A person counts as a current occupant only where their occupancy has no departure date AND the tenancy still holds its room. A tenancy that ended or was cancelled leaves nobody occupying anything — in particular, cancelling a tenancy does not record a departure for its occupants, so occupancy SHALL NOT be judged from the departure date alone.

The refusal SHALL name the room the person already occupies. The owner's next action is to end that tenancy, and a refusal that does not say which room makes them search for it.

#### Scenario: Signing a tenancy for somebody who already has a room

- **WHEN** the owner signs a tenancy whose signatory currently occupies another room
- **THEN** it is refused, and the refusal names the room they are in

#### Scenario: Adding an occupant who already has a room

- **WHEN** the owner adds somebody to a tenancy while they currently occupy another room
- **THEN** it is refused, and the refusal names the room they are in

#### Scenario: Somebody whose previous tenancy ended

- **WHEN** the owner records somebody whose only other tenancy has ended
- **THEN** it is accepted

#### Scenario: Somebody whose previous tenancy was cancelled

- **WHEN** the owner records somebody whose only other tenancy was cancelled
- **THEN** it is accepted, even though that tenancy recorded no departure for them

#### Scenario: Renewing a tenancy for its own occupants

- **WHEN** a tenancy is extended, carrying its occupants onto the successor
- **THEN** they are not refused for occupying the tenancy that was just closed
