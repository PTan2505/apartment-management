## ADDED Requirements

### Requirement: A tenancy can be started from the room it is for

The rooms screen SHALL show whether each room is currently let, and SHALL offer to start a tenancy on a room that is not.

Signing an agreement begins with a particular room — the owner knows which one is empty before they know whose name goes on it. Requiring them to leave for the tenancies screen and find the room again inverts the order the work actually happens in.

The action SHALL NOT be offered on a room that is already let, nor on one that has been taken out of service, and the form it opens SHALL arrive with that room already chosen.

Whether a room is let SHALL be read from what the API reports about the room, not assembled by fetching tenancies.

#### Scenario: A vacant room offers a tenancy

- **WHEN** the owner views a room in service with no running tenancy
- **THEN** a way to start a tenancy on it is offered

#### Scenario: Starting from a room pre-selects it

- **WHEN** the owner starts a tenancy from a room
- **THEN** the form opens with that room already chosen

#### Scenario: An occupied room does not offer one

- **WHEN** the owner views a room that already has a running tenancy
- **THEN** no way to start another is offered, and the room is shown as let

#### Scenario: A retired room does not offer one

- **WHEN** the owner views a room that has been taken out of service
- **THEN** no way to start a tenancy on it is offered
