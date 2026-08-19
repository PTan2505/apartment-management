## MODIFIED Requirements

### Requirement: Owner can list and retrieve rooms
The system SHALL allow an authenticated `owner` to list rooms, filter them by building, search them by room code, and retrieve a single room by id. Listing SHALL return only active rooms unless retired rooms are explicitly requested. The room-code search SHALL match any room whose code contains the given text, SHALL ignore case, and SHALL be combinable with the other filters. Room codes SHALL NOT be usable in place of a room id, because the same code may exist in several buildings and may be reused after a room is retired. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

Every room SHALL report the building it belongs to, identifying that building by both id and display name, so a room can be shown and understood without a further request. A room code identifies a room only within its building, so a room reported without its building is ambiguous. The building SHALL be reported identically wherever a room is returned, whether listed or retrieved singly.

The room SHALL continue to report the building's id directly as well, so callers reading it are unaffected.

The reported building SHALL be limited to what identifies it. Its rates, address, and status SHALL NOT be included, because they belong to the building's own representation and would be duplicated into every room that references it.

#### Scenario: Listing rooms in a building
- **WHEN** an authenticated owner lists rooms filtered by a building id
- **THEN** the response contains only that building's active rooms

#### Scenario: Listing can include retired rooms
- **WHEN** an authenticated owner lists rooms explicitly requesting retired ones to be included
- **THEN** the response contains both active and retired rooms

#### Scenario: Retrieving a room that does not exist
- **WHEN** an authenticated owner requests a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: A listed room reports its building
- **WHEN** an authenticated owner lists rooms
- **THEN** each room reports the building it belongs to, by id and display name

#### Scenario: A retrieved room reports its building
- **WHEN** an authenticated owner retrieves a single room by id
- **THEN** it reports its building in the same form as a listed room does

#### Scenario: The reported building is limited to what identifies it
- **WHEN** a room reports its building
- **THEN** that building carries its id and display name, and does not carry its rates, address, or active state

#### Scenario: The building id is still reported directly
- **WHEN** an authenticated owner lists or retrieves a room
- **THEN** the room still reports its building's id as a direct field, so a caller reading it continues to work

#### Scenario: Rooms sharing a code are distinguishable
- **WHEN** an authenticated owner searches a room code that exists in more than one building
- **THEN** each returned room reports its own building, so the results can be told apart

#### Scenario: A retired room still reports its building
- **WHEN** an authenticated owner lists rooms including retired ones
- **THEN** a retired room reports its building exactly as an active one does

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
