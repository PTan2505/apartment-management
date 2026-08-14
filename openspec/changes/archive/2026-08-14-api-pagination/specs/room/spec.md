## MODIFIED Requirements

### Requirement: Owner can list and retrieve rooms
The system SHALL allow an authenticated `owner` to list rooms, filter them by building, search them by room code, and retrieve a single room by id. Listing SHALL return only active rooms unless retired rooms are explicitly requested. The room-code search SHALL match any room whose code contains the given text, SHALL ignore case, and SHALL be combinable with the other filters. Room codes SHALL NOT be usable in place of a room id, because the same code may exist in several buildings and may be reused after a room is retired. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

#### Scenario: Listing rooms in a building
- **WHEN** an authenticated owner lists rooms filtered by a building id
- **THEN** the response contains only that building's active rooms

#### Scenario: Listing can include retired rooms
- **WHEN** an authenticated owner lists rooms explicitly requesting retired ones to be included
- **THEN** the response contains both active and retired rooms

#### Scenario: Retrieving a room that does not exist
- **WHEN** an authenticated owner requests a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Searching by room code within a building
- **WHEN** an authenticated owner lists rooms filtered by a building id and searching for a room code
- **THEN** the response contains only that building's active rooms whose code contains the search text

#### Scenario: Search matches every room containing the text
- **WHEN** an authenticated owner searches for a room code that several rooms' codes contain, such as searching `10` where rooms `10`, `101` and `102` exist
- **THEN** the response contains all of those rooms, because the search is a partial match rather than an exact code lookup

#### Scenario: Search ignores case
- **WHEN** an authenticated owner searches using different letter casing from the stored room code
- **THEN** the response still contains the matching rooms

#### Scenario: The same room code across buildings
- **WHEN** an authenticated owner searches by a room code without naming a building, and several buildings each have an active room with that code
- **THEN** the response contains one entry per matching building, because a room code does not identify a single room on its own

#### Scenario: Reused room code with retired history
- **WHEN** an authenticated owner searches by a room code in a building where an earlier room with that code was retired and a new active room reuses it, requesting retired rooms to be included
- **THEN** the response contains both the retired room and the active one

#### Scenario: Search with no match
- **WHEN** an authenticated owner searches by text that no room code contains
- **THEN** the system responds with HTTP 200 and an empty list

#### Scenario: Room listing is paginated
- **WHEN** an authenticated owner lists rooms
- **THEN** the response is the shared paginated shape, with the rooms in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to searched and filtered results
- **WHEN** an authenticated owner searches rooms by code within a building and asks for a specific page
- **THEN** the items and totals describe only the rooms matching that building and search
