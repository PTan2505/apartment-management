## ADDED Requirements

### Requirement: A listed building reports how many of its rooms are let and empty
The system SHALL include, with every building in the list response, a count of the rooms that are currently let and a count of the rooms that are currently empty.

Both counts SHALL be taken over the building's rooms that are in service, and a room SHALL count as let on exactly the rule the rooms list uses: it has a tenancy with no move-out recorded and no cancellation. A room in service that is not let counts as empty, so the two SHALL always sum to the rooms in service.

A retired room SHALL be counted in neither, because it cannot be offered to anyone and counting it as empty would report work that does not exist.

The counts SHALL be computed by the API rather than derived by a caller, because deriving them requires reading every room of every building on the page and the rule for "let" already lives in one place.

#### Scenario: Counts accompany each listed building
- **WHEN** an authenticated owner lists buildings
- **THEN** each building in the response carries the number of its in-service rooms that are let and the number that are empty

#### Scenario: A tenancy past its agreed term still holds its room
- **GIVEN** a room whose tenancy has run past its agreed end date with no move-out recorded
- **WHEN** an authenticated owner lists buildings
- **THEN** that room counts as let, not as empty

#### Scenario: A cancelled tenancy frees its room
- **GIVEN** a room whose only tenancy was cancelled
- **WHEN** an authenticated owner lists buildings
- **THEN** that room counts as empty

#### Scenario: A retired room is counted in neither
- **GIVEN** a building with a retired room
- **WHEN** an authenticated owner lists buildings
- **THEN** the retired room is absent from both counts, and the two counts sum to the building's rooms that are in service

#### Scenario: A building with no rooms
- **WHEN** an authenticated owner lists a building that has no rooms
- **THEN** both counts are zero
