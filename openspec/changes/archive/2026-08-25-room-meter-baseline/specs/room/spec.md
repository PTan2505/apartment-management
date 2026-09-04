## MODIFIED Requirements

### Requirement: Owner can create a room in a building
The system SHALL allow an authenticated `owner` to create a room belonging to an existing building, with a room code, a base monthly rent, and OPTIONALLY the electricity meter reading the room stands at. Base rent MUST NOT be negative, and neither MUST the meter reading.

**The meter reading is the room's starting position and nothing else.** Every other reading this system holds is one half of a difference — consumption is always a closing figure minus an opening one — and this is the only figure that has nothing before it. It therefore has to be stated rather than derived, and the moment to state it is when the room is added, while the owner is looking at the meter.

It SHALL remain optional. Rooms already exist without one, and no figure can honestly be invented for them.

Zero SHALL be accepted as a stated value, distinct from omitting it. A meter genuinely at zero and a meter nobody read are different facts, and treating them alike is what would charge an owner for a meter's entire history as one month's consumption.

#### Scenario: Successful creation
- **WHEN** an authenticated owner creates a room with a valid room code and base rent in an existing active building
- **THEN** the system creates the room as active and responds with HTTP 201 and the created room

#### Scenario: Creating a room with its meter reading

- **WHEN** an authenticated owner creates a room stating the meter reads 8,432
- **THEN** the room records 8,432 as its opening reading

#### Scenario: Creating a room without a meter reading

- **WHEN** an authenticated owner creates a room without stating a meter reading
- **THEN** the room is created with no opening reading recorded

#### Scenario: A meter genuinely at zero

- **WHEN** an authenticated owner creates a room stating the meter reads 0
- **THEN** the room records 0, which is a different fact from having no reading recorded

#### Scenario: A negative meter reading
- **WHEN** an authenticated owner supplies a negative meter reading
- **THEN** the system responds with HTTP 400 and does not create the room

#### Scenario: Building does not exist
- **WHEN** an authenticated owner creates a room referencing a building id that does not exist
- **THEN** the system responds with HTTP 404 and does not create the room

#### Scenario: Building is retired
- **WHEN** an authenticated owner creates a room in a building that has been retired
- **THEN** the system responds with HTTP 400 and does not create the room

#### Scenario: Negative base rent rejected
- **WHEN** an authenticated owner submits a negative base rent
- **THEN** the system responds with HTTP 400 and does not create the room

## ADDED Requirements

### Requirement: A room's opening reading counts as a known meter position

The system SHALL treat a room's recorded opening reading as one of the sources for that room's current meter position, alongside the reading a lease opened from, the reading a lease closed at, and any vacancy record. The most recent of them SHALL win, exactly as it does today.

Adding it as a fourth source rather than a special case is what makes it disappear from every later calculation. On a room that has been let, the tenancy's readings are newer and the opening figure is simply never the most recent. On a room that has never been let, it is the only one there is — which is the situation this exists for.

A room with no recorded opening reading and no tenancy history SHALL continue to report no known position, because it genuinely has none.

#### Scenario: A never-let room reports its opening reading

- **WHEN** a room was created with an opening reading and has never been let
- **THEN** its known meter position is that reading

#### Scenario: A tenancy's reading supersedes it

- **WHEN** a room created with an opening reading is later let, and that tenancy records readings of its own
- **THEN** the room's known position comes from the tenancy, because those readings are more recent

#### Scenario: A room with nothing recorded at all

- **WHEN** a room has neither an opening reading nor any tenancy history
- **THEN** it reports no known meter position

#### Scenario: A room's first lease can default from it

- **WHEN** an authenticated owner creates the first lease for a room that has an opening reading, without supplying a starting reading
- **THEN** the lease starts from the room's recorded reading, rather than being refused for having nothing to fall back on
