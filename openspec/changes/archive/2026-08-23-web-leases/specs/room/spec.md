## ADDED Requirements

### Requirement: A room reports whether it is currently let

Every room the system returns SHALL report whether a tenancy is currently running in it, and SHALL do so identically whether the room is listed or retrieved on its own.

Whether a room is free is a fact about the room, not a conclusion to be assembled by whoever asks. Without it, a caller wanting to know which rooms can be let has to fetch every running tenancy and subtract — a second request whose cost grows with the number of tenancies, and an answer that is stale the moment it is computed. The system already knows this to refuse retiring an occupied room; it simply does not say it.

The system SHALL also allow rooms to be filtered to those with no running tenancy, combinable with the existing filters. A caller offering a choice of rooms to let needs the vacant ones, not all of them minus a list it has to work out.

This reports only whether a tenancy is running, not which one. A room's representation SHALL NOT carry the tenancy's own details — those belong to the tenancy, and duplicating them into every room repeats the mistake this requirement avoids.

#### Scenario: An occupied room says so

- **WHEN** an authenticated owner retrieves a room that has a running tenancy
- **THEN** the response reports the room as let

#### Scenario: A vacant room says so

- **WHEN** an authenticated owner retrieves a room with no running tenancy
- **THEN** the response reports the room as not let

#### Scenario: A room whose tenancy has ended is vacant again

- **WHEN** the only tenancy in a room has recorded a move-out
- **THEN** the room is reported as not let

#### Scenario: A tenancy past its term still holds the room

- **WHEN** a room's tenancy has passed its expected end date with no move-out recorded
- **THEN** the room is still reported as let, because the tenancy has not been closed and the room is not free to let again

#### Scenario: Listed rooms report it too

- **WHEN** an authenticated owner lists rooms
- **THEN** each reports whether it is let, in the same form as when retrieved singly

#### Scenario: Filtering to rooms that can be let

- **WHEN** an authenticated owner lists rooms filtered to those with no running tenancy
- **THEN** the response contains only rooms that are not let

#### Scenario: The vacancy filter combines with the others

- **WHEN** an authenticated owner filters to vacant rooms within one building
- **THEN** the response contains only that building's rooms with no running tenancy

#### Scenario: The tenancy's own details are not included

- **WHEN** an authenticated owner retrieves a room that is let
- **THEN** the response says that it is let without carrying the tenancy's terms, tenant, or dates
