## MODIFIED Requirements

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

