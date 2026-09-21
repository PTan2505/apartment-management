## ADDED Requirements

### Requirement: A running tenancy is never left with nobody living in it

The system SHALL refuse to record the departure of a lease's only current occupant, and the refusal SHALL name the operation that does end a tenancy.

Accepting it produces a tenancy that is running, billed, holding a deposit and occupying a room, with nobody recorded as living there. Nothing downstream is prepared for that: the room is not free, the tenancy is not closed, and the screens report a tenancy whose occupant list is empty. It is never what the owner meant — it is what they get when the operation they wanted was the tenancy's move-out and the action in front of them was the person's departure.

A tenancy that has already recorded its move-out SHALL NOT be affected by this rule. Its occupants' departures are history, and closing the tenancy is what set them.

#### Scenario: The only occupant cannot simply leave

- **WHEN** an owner records a departure for the only current occupant of a running tenancy
- **THEN** the system refuses, says that ending the tenancy is the operation for this, and the occupant remains current

#### Scenario: One of several can leave

- **WHEN** an owner records a departure for one of two or more current occupants
- **THEN** the departure is recorded and the others remain

#### Scenario: Ending the tenancy still works

- **WHEN** an owner records the tenancy's move-out
- **THEN** it is accepted, and the fact that one occupant remained is not an obstacle

### Requirement: Departing the responsible occupant hands over responsibility in the same operation

Where the departing occupant is the one responsible for the agreement and other occupants remain, the system SHALL accept the successor as part of recording the departure, and SHALL write both facts in one transaction.

Two requests can half-succeed. A transfer that lands followed by a departure that fails leaves the agreement naming somebody who never took it over while the previous holder still lives there — a state nobody asked for, reached silently, and visible only to a reader who compares the occupant list against the signatory.

The successor SHALL be a current occupant of that lease other than the person leaving. Where no successor is supplied and others remain, the system SHALL refuse as it does today, because an agreement cannot be left with occupants and nobody answerable for it.

#### Scenario: Departing with a successor named

- **WHEN** an owner records the departure of the responsible occupant and names another current occupant as successor
- **THEN** that person becomes responsible for the agreement and the departure is recorded, both in one transaction

#### Scenario: Neither is written when one fails

- **WHEN** the departure of a responsible occupant fails after the handover would have been written
- **THEN** the lease still names the original person as responsible, and that person is still a current occupant

#### Scenario: Departing the responsible occupant with nobody named

- **WHEN** an owner records the departure of the responsible occupant, other occupants remain, and no successor is supplied
- **THEN** the system refuses and the occupant remains current

#### Scenario: A successor who is not an occupant

- **WHEN** the named successor is not a current occupant of that lease
- **THEN** the system refuses and nothing is written
