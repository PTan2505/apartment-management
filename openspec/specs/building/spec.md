## Purpose

Lets an owner define and maintain the apartment buildings they manage, including the per-kWh electricity rate and per-person water rate that later billing uses to charge each room in that building.
## Requirements
### Requirement: Owner can create a building
The system SHALL allow an authenticated `owner` to create a building with a display name, a street address, a ward, a city, an electricity rate per kWh, and a water rate per person. Rate values MUST NOT be negative. The country SHALL default to Vietnam when not supplied. Ward and city are required, because a building missing either could not be found by the filters that exist to locate it.

A building MAY additionally record the identifier of the place its address was resolved from. It is optional, because an address may be typed by hand and then no such place exists. It is recorded so an address resolved today can be resolved again later — for instance after administrative boundaries change again — without the address having to be re-entered from memory.

Recording that identifier SHALL NOT change how the address itself is validated. The address, ward, and city are the record; the identifier only says where they came from.

#### Scenario: Successful creation
- **WHEN** an authenticated owner submits a valid display name, address, electricity rate, and water rate
- **THEN** the system creates the building as active and responds with HTTP 201 and the created building

#### Scenario: Negative rate rejected
- **WHEN** an authenticated owner submits a negative electricity rate or water rate
- **THEN** the system responds with HTTP 400 and does not create the building

#### Scenario: Missing required field
- **WHEN** an authenticated owner submits a request missing the display name, address, or either rate
- **THEN** the system responds with HTTP 400 identifying the invalid input

#### Scenario: Country defaults when not supplied
- **WHEN** an authenticated owner creates a building without naming a country
- **THEN** the building records Vietnam as its country

#### Scenario: Country supplied explicitly
- **WHEN** an authenticated owner creates a building naming a country
- **THEN** the building records that country instead of the default

#### Scenario: Ward or city missing
- **WHEN** an authenticated owner creates a building without a ward or without a city
- **THEN** the system responds with HTTP 400 and does not create the building

#### Scenario: Address holds the street line only
- **WHEN** an authenticated owner creates a building
- **THEN** the address records the house number and street, with the ward, city, and country held separately rather than repeated inside it

#### Scenario: Creating with a resolved place identifier
- **WHEN** an authenticated owner creates a building supplying the identifier of the place its address was resolved from
- **THEN** the building records that identifier and reports it on the created building

#### Scenario: Creating without a resolved place identifier
- **WHEN** an authenticated owner creates a building without supplying such an identifier
- **THEN** the building is created and records no identifier, indicating an address that was not resolved from a place

### Requirement: Owner can list and retrieve buildings
The system SHALL allow an authenticated `owner` to list buildings, filter them by ward, by city, and by whether they are in service, and retrieve a single building by id.

The in-service filter SHALL accept three answers — only buildings in service, only buildings taken out of service, or both — because "what have I taken out of service" is a question the owner asks while tidying up, and a flag that only widens the result cannot express it. When the filter is not given, listing SHALL return only buildings in service, so a caller that does not ask about retirement is unaffected.

The ward and city filters SHALL match any building whose value contains the given text, SHALL ignore case, and SHALL be combinable with each other and with the other filters. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

#### Scenario: Listing excludes retired buildings by default
- **WHEN** an authenticated owner lists buildings and some buildings have been retired
- **THEN** the response contains only active buildings

#### Scenario: Listing can include retired buildings
- **WHEN** an authenticated owner lists buildings explicitly requesting retired ones to be included
- **THEN** the response contains both active and retired buildings

#### Scenario: Retrieving a building that does not exist
- **WHEN** an authenticated owner requests a building id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Building listing is paginated
- **WHEN** an authenticated owner lists buildings
- **THEN** the response is the shared paginated shape, with the buildings in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to the filtered set
- **WHEN** an authenticated owner lists buildings requesting retired ones to be included and asks for a specific page
- **THEN** the items and totals describe the combined active and retired set, not the active-only set

#### Scenario: Filtering by city
- **WHEN** an authenticated owner lists buildings filtered by a city
- **THEN** the response contains only buildings whose city contains that text

#### Scenario: Filtering by ward
- **WHEN** an authenticated owner lists buildings filtered by a ward
- **THEN** the response contains only buildings whose ward contains that text

#### Scenario: Filtering by ward and city together
- **WHEN** an authenticated owner lists buildings filtered by both a ward and a city
- **THEN** the response contains only buildings matching both

#### Scenario: Location filters ignore case
- **WHEN** an authenticated owner filters by a city or ward using different letter casing from the stored value
- **THEN** the response still contains the matching buildings

#### Scenario: Location filter combined with retired buildings
- **WHEN** an authenticated owner filters by city while also requesting retired buildings to be included
- **THEN** the response contains both active and retired buildings in that city

#### Scenario: Location filter with no match
- **WHEN** an authenticated owner filters by a city or ward that no building matches
- **THEN** the system responds with HTTP 200 and an empty list

#### Scenario: Listing can include retired buildings
- **WHEN** an authenticated owner lists buildings asking for both statuses
- **THEN** the response contains both buildings in service and buildings out of service

#### Scenario: Listing excludes retired buildings by default
- **WHEN** an authenticated owner lists buildings without naming a status and some buildings have been retired
- **THEN** the response contains only buildings in service

#### Scenario: Listing everything
- **WHEN** an authenticated owner lists buildings asking for both
- **THEN** the response contains buildings in service and buildings out of service

#### Scenario: Listing only what is out of service
- **WHEN** an authenticated owner lists buildings asking only for those out of service
- **THEN** the response contains only retired buildings, and none that are in service

#### Scenario: An unknown status is refused
- **WHEN** an authenticated owner lists buildings naming a status that is not one of the three
- **THEN** the system responds with HTTP 400 rather than silently listing a default

#### Scenario: Retrieving a building that does not exist
- **WHEN** an authenticated owner requests a building id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Building listing is paginated
- **WHEN** an authenticated owner lists buildings
- **THEN** the response is the shared paginated shape, with the buildings in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to the filtered set
- **WHEN** an authenticated owner lists buildings asking for both statuses and asks for a specific page
- **THEN** the items and totals describe the combined set, not the in-service-only set

#### Scenario: Filtering by city
- **WHEN** an authenticated owner lists buildings filtered by a city
- **THEN** the response contains only buildings whose city contains that text

#### Scenario: Filtering by ward
- **WHEN** an authenticated owner lists buildings filtered by a ward
- **THEN** the response contains only buildings whose ward contains that text

### Requirement: Owner can update a building
The system SHALL allow an authenticated `owner` to update a building's display name, street address, ward, city, country, and utility rates. Changing a rate SHALL NOT alter any invoice already issued, because each invoice records the rate that was applied at the time it was created.

The identifier of the place the address was resolved from MAY also be updated, so that re-resolving an address records where the new values came from. It MAY be cleared, for an address subsequently corrected by hand — leaving it in place would claim the address came from a place it no longer matches.

#### Scenario: Successful update
- **WHEN** an authenticated owner updates an existing building with valid values
- **THEN** the system saves the changes and responds with HTTP 200 and the updated building

#### Scenario: Updating a building that does not exist
- **WHEN** an authenticated owner updates a building id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Updating the location fields
- **WHEN** an authenticated owner updates a building's ward, city, or country
- **THEN** the system saves the changes and the building is found by filters matching the new values

#### Scenario: Clearing a required location field
- **WHEN** an authenticated owner updates a building setting its ward or city to an empty value
- **THEN** the system responds with HTTP 400 and does not apply the change

#### Scenario: Updating the resolved place identifier
- **WHEN** an authenticated owner updates a building supplying a new resolved place identifier
- **THEN** the building records the new identifier

#### Scenario: Clearing the resolved place identifier
- **WHEN** an authenticated owner updates a building clearing its resolved place identifier
- **THEN** the building records no identifier, and its address fields are unaffected

### Requirement: Owner can retire and restore a building
The system SHALL allow an authenticated `owner` to retire a building by marking it inactive, and to restore a retired building. The system SHALL NOT support permanently deleting a building, so that leases and invoices referencing it retain their history. The system SHALL reject retiring a building while any of its rooms has an active lease, so a building with tenants still in place cannot be taken out of service.

#### Scenario: Retiring a building
- **WHEN** an authenticated owner retires an active building in which no room has an active lease
- **THEN** the building is marked inactive, is excluded from default building listings, and its record still exists

#### Scenario: Retiring a building with an occupied room
- **WHEN** an authenticated owner retires a building in which at least one room has an active lease
- **THEN** the system responds with HTTP 409 and the building remains active

#### Scenario: Retiring a building after all tenants move out
- **WHEN** an authenticated owner retires a building whose rooms all have their leases finalized
- **THEN** the building is marked inactive

#### Scenario: Restoring a retired building
- **WHEN** an authenticated owner restores a retired building
- **THEN** the building is marked active again and reappears in default building listings

#### Scenario: Retiring a building does not retire its rooms
- **WHEN** an authenticated owner retires a building that contains active rooms
- **THEN** those rooms remain individually active, and retiring the building does not change their state

### Requirement: Building endpoints require an authenticated owner
The system SHALL reject any building request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any building endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any building endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request

### Requirement: Owner can retrieve the locations buildings are in
The system SHALL allow an authenticated `owner` to retrieve the distinct cities, each with the distinct wards recorded for buildings in that city, so a location filter can offer real choices rather than free text.

The result SHALL be filtered by the same in-service statuses the listing accepts, and SHALL be taken over exactly the set the listing would return for that status, because a location offered as a filter choice must not produce an empty result.

Cities and wards SHALL be ordered as Vietnamese rather than by character code.

#### Scenario: Retrieving locations in use

- **WHEN** an authenticated owner requests the locations
- **THEN** the system responds with HTTP 200 and every city that has at least one building, each carrying the wards recorded in that city

#### Scenario: A city is reported once with all of its wards

- **WHEN** several buildings share a city but sit in different wards
- **THEN** that city appears once, carrying each of those wards

#### Scenario: The same ward name in two cities

- **WHEN** buildings in two different cities record the same ward name
- **THEN** that ward appears under each of those cities

#### Scenario: Values are reported exactly as stored

- **WHEN** a building records a ward or city with particular casing or diacritics
- **THEN** the value is reported unchanged, and using it as a filter returns that building

#### Scenario: Differing spellings are reported separately

- **WHEN** two buildings record the same place with different spellings
- **THEN** both spellings are reported as separate values rather than being merged

#### Scenario: Vietnamese ordering

- **WHEN** the reported values include Vietnamese letters that fall outside the plain Latin alphabet
- **THEN** they are ordered by their place in the Vietnamese alphabet rather than by character code

#### Scenario: Retired buildings are excluded by default

- **WHEN** an authenticated owner requests the locations and the only building in a city has been retired
- **THEN** that city is not reported

#### Scenario: Retired buildings can be included

- **WHEN** an authenticated owner requests the locations, explicitly asking for retired buildings to be included
- **THEN** the locations of retired buildings are reported alongside those of active ones

#### Scenario: No buildings at all

- **WHEN** an authenticated owner requests the locations and no building matches
- **THEN** the system responds with HTTP 200 and an empty set of locations rather than an error

#### Scenario: The response is not paginated

- **WHEN** an authenticated owner requests the locations
- **THEN** the response carries the locations directly, without page or total information

#### Scenario: Unauthenticated request

- **WHEN** a request for the locations has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request

- **WHEN** a request for the locations carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request

#### Scenario: Retired buildings are excluded by default
- **WHEN** an authenticated owner retrieves locations without naming a status
- **THEN** cities and wards are taken only from buildings in service

#### Scenario: Retired buildings can be included
- **WHEN** an authenticated owner retrieves locations asking for both statuses
- **THEN** cities and wards are taken from buildings in service and out of service alike

#### Scenario: Locations follow the status asked for
- **WHEN** an authenticated owner retrieves locations for a given in-service status
- **THEN** the cities and wards are exactly those of the buildings that status would list

#### Scenario: Vietnamese ordering
- **WHEN** an authenticated owner retrieves locations
- **THEN** cities and wards are ordered alphabetically as Vietnamese

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

