## MODIFIED Requirements

### Requirement: Owner can list and retrieve rooms
The system SHALL allow an authenticated `owner` to list rooms, filter them by building and by room code, and retrieve a single room by id. Listing SHALL return only active rooms unless retired rooms are explicitly requested. The room-code filter SHALL match exactly, and SHALL be combinable with the other filters. Room codes SHALL NOT be usable in place of a room id, because the same code may exist in several buildings and may be reused after a room is retired.

#### Scenario: Listing rooms in a building
- **WHEN** an authenticated owner lists rooms filtered by a building id
- **THEN** the response contains only that building's active rooms

#### Scenario: Listing can include retired rooms
- **WHEN** an authenticated owner lists rooms explicitly requesting retired ones to be included
- **THEN** the response contains both active and retired rooms

#### Scenario: Retrieving a room that does not exist
- **WHEN** an authenticated owner requests a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Filtering by room code within a building
- **WHEN** an authenticated owner lists rooms filtered by a building id and a room code
- **THEN** the response contains only that building's active room with exactly that code

#### Scenario: The same room code across buildings
- **WHEN** an authenticated owner lists rooms filtered by a room code without naming a building, and several buildings each have an active room with that code
- **THEN** the response contains one entry per matching building, because a room code does not identify a single room on its own

#### Scenario: Room code filter matches exactly
- **WHEN** an authenticated owner filters by a room code that is a prefix or substring of other room codes
- **THEN** the response contains only rooms whose code matches exactly, and excludes the ones it is merely a substring of

#### Scenario: Reused room code with retired history
- **WHEN** an authenticated owner filters by a room code in a building where an earlier room with that code was retired and a new active room reuses it, requesting retired rooms to be included
- **THEN** the response contains both the retired room and the active one

#### Scenario: Room code with no match
- **WHEN** an authenticated owner filters by a room code that no room uses
- **THEN** the system responds with HTTP 200 and an empty list
