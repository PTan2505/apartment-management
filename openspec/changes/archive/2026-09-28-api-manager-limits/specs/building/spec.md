## MODIFIED Requirements

### Requirement: Owner can create a building
The system SHALL allow an authenticated `owner` to create a building with a display name, a street address, a ward, a city, an electricity rate per kWh, a water rate per person, and the number of months of rent its tenancies take as a deposit by default. Rate values MUST NOT be negative, and the default deposit MUST be a whole number of months and MUST NOT be negative. The default deposit SHALL itself default to one month when not supplied, that being the common arrangement; zero SHALL be accepted, for a building that takes no deposit. The country SHALL default to Vietnam when not supplied. Ward and city are required, because a building missing either could not be found by the filters that exist to locate it.

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

#### Scenario: Default deposit supplied
- **WHEN** an authenticated owner creates a building naming two months as its default deposit
- **THEN** the building records two, and tenancies signed in it default to a deposit of two months

#### Scenario: Default deposit omitted
- **WHEN** an authenticated owner creates a building without naming a default deposit
- **THEN** the building records one month

#### Scenario: A building that takes no deposit
- **WHEN** an authenticated owner creates a building naming zero months as its default deposit
- **THEN** the building records zero, which is distinct from having named nothing

#### Scenario: Negative or fractional default deposit
- **WHEN** an authenticated owner submits a default deposit that is negative or is not a whole number of months
- **THEN** the system responds with HTTP 400 and does not create the building

### Requirement: Owner can update a building
The system SHALL allow an authenticated `owner` to update a building's display name, street address, ward, city, country, utility rates, and default deposit months. Changing a rate SHALL NOT alter any invoice already issued, because each invoice records the rate that was applied at the time it was created. Changing the default deposit SHALL NOT alter any tenancy already signed, which records the deposit it was signed at; it SHALL apply to tenancies signed afterwards.

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

#### Scenario: Changing the default deposit
- **WHEN** an authenticated owner changes a building's default deposit months
- **THEN** tenancies signed afterwards default to the new number, and every tenancy already signed keeps the deposit it recorded
