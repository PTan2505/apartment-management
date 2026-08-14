## MODIFIED Requirements

### Requirement: Owner can list and retrieve customers
The system SHALL allow an authenticated `owner` to list customers and retrieve a single customer by id. Customer records SHALL never expose password material. Listing SHALL be paginated using the shared paginated response contract, so the response carries a `data` array and a `meta` object describing the page and totals rather than a bare array.

#### Scenario: Listing customers
- **WHEN** an authenticated owner lists customers
- **THEN** the response contains only `customer`-role users and excludes `owner` accounts

#### Scenario: Retrieving a customer that does not exist
- **WHEN** an authenticated owner requests a customer id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Password material is never returned
- **WHEN** an authenticated owner lists or retrieves customers
- **THEN** no response includes a password or password hash field

#### Scenario: Customer listing is paginated
- **WHEN** an authenticated owner lists customers
- **THEN** the response is the shared paginated shape, with the customers in `data` and the page, page size, and totals in `meta`

#### Scenario: Paging applies to searched results
- **WHEN** an authenticated owner searches customers and asks for a specific page
- **THEN** the items and totals describe only the customers matching the search
