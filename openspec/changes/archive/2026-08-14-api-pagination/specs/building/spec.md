## MODIFIED Requirements

### Requirement: Owner can list and retrieve buildings
The system SHALL allow an authenticated `owner` to list buildings and retrieve a single building by id. Listing SHALL return only active buildings unless retired buildings are explicitly requested. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

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
