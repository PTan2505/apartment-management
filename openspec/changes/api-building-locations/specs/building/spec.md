## ADDED Requirements

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
