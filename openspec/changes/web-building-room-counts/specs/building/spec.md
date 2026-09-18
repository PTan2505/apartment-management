## ADDED Requirements

### Requirement: A listed building reports how many of its rooms are let and empty
The system SHALL include, with every building in the list response, a count of the rooms that are currently let and a count of the rooms that are currently empty.

Both counts SHALL be taken over the building's rooms that are in service, and a room SHALL count as let on exactly the rule the rooms list uses: it has a tenancy with no move-out recorded and no cancellation. A room in service that is not let counts as empty, so the two SHALL always sum to the rooms in service.

A retired room SHALL be counted in neither, because it cannot be offered to anyone and counting it as empty would report work that does not exist. It SHALL instead be reported as its own count, so a building that has taken rooms out of service says so rather than appearing smaller than it is.

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
- **THEN** the retired room is absent from the let and empty counts, those two sum to the building's rooms that are in service, and the room appears in the retired count

#### Scenario: A room returned to service moves between the counts
- **GIVEN** a building with a retired room
- **WHEN** the owner restores that room and lists buildings again
- **THEN** the retired count falls by one and the empty count rises by one

#### Scenario: A building with no rooms
- **WHEN** an authenticated owner lists a building that has no rooms
- **THEN** both counts are zero

### Requirement: Retrieving one building reports the same counts
The system SHALL include the let, empty and retired room counts when a single building is retrieved, computed exactly as they are for the list, so a screen showing one building need not fetch its rooms to say how full it is.

The counts SHALL NOT be attached to the building record that the update and retire operations read internally, because those operations do not use them and would pay for them on every write.

#### Scenario: Counts accompany a retrieved building
- **WHEN** an authenticated owner retrieves one building
- **THEN** the response carries its let, empty and retired room counts

#### Scenario: The same building reads the same in both places
- **WHEN** an authenticated owner retrieves a building and also lists it
- **THEN** the counts are identical in both responses
