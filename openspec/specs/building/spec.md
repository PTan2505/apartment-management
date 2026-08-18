## Purpose

Lets an owner define and maintain the apartment buildings they manage, including the per-kWh electricity rate and per-person water rate that later billing uses to charge each room in that building.

## Requirements

### Requirement: Owner can create a building
The system SHALL allow an authenticated `owner` to create a building with a display name, a street address, a ward, a city, an electricity rate per kWh, and a water rate per person. Rate values MUST NOT be negative. The country SHALL default to Vietnam when not supplied. Ward and city are required, because a building missing either could not be found by the filters that exist to locate it.

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

### Requirement: Owner can list and retrieve buildings
The system SHALL allow an authenticated `owner` to list buildings, filter them by ward and by city, and retrieve a single building by id. Listing SHALL return only active buildings unless retired buildings are explicitly requested. The ward and city filters SHALL match any building whose value contains the given text, SHALL ignore case, and SHALL be combinable with each other and with the other filters. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

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

### Requirement: Owner can update a building
The system SHALL allow an authenticated `owner` to update a building's display name, street address, ward, city, country, and utility rates. Changing a rate SHALL NOT alter any invoice already issued, because each invoice records the rate that was applied at the time it was created.

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

The system SHALL allow an authenticated `owner` to retrieve the ward and city values that buildings currently record, so that a caller can offer them as choices instead of asking for free text.

Each city SHALL be reported once, together with the wards recorded for buildings in that city. A ward SHALL appear under every city it is recorded with, because the same ward name may exist in more than one city and the pairing is what makes a narrowed choice correct.

Values SHALL be reported exactly as stored, with no normalisation, so that a value returned here matches the building it came from when used as a filter. Two spellings of the same place are therefore reported as two values.

Results SHALL be ordered as Vietnamese text rather than by character code, because ordering by character code places letters such as `Đ` outside their alphabetical position and produces a list that reads as unordered.

By default only the locations of active buildings SHALL be reported. Retired buildings' locations SHALL be included only when explicitly requested, matching the behaviour of building listing — a location offered as a filter choice must not return an empty result.

This response SHALL NOT be paginated. It is a bounded summary rather than a listing, so it carries no page or total information.

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
