## Purpose

Lets an owner define and maintain the apartment buildings they manage, including the per-kWh electricity rate and per-person water rate that later billing uses to charge each room in that building.

## Requirements

### Requirement: Owner can create a building
The system SHALL allow an authenticated `owner` to create a building with a display name, address, electricity rate per kWh, and water rate per person. Rate values MUST NOT be negative.

#### Scenario: Successful creation
- **WHEN** an authenticated owner submits a valid display name, address, electricity rate, and water rate
- **THEN** the system creates the building as active and responds with HTTP 201 and the created building

#### Scenario: Negative rate rejected
- **WHEN** an authenticated owner submits a negative electricity rate or water rate
- **THEN** the system responds with HTTP 400 and does not create the building

#### Scenario: Missing required field
- **WHEN** an authenticated owner submits a request missing the display name, address, or either rate
- **THEN** the system responds with HTTP 400 identifying the invalid input

### Requirement: Owner can list and retrieve buildings
The system SHALL allow an authenticated `owner` to list buildings and retrieve a single building by id. Listing SHALL return only active buildings unless retired buildings are explicitly requested.

#### Scenario: Listing excludes retired buildings by default
- **WHEN** an authenticated owner lists buildings and some buildings have been retired
- **THEN** the response contains only active buildings

#### Scenario: Listing can include retired buildings
- **WHEN** an authenticated owner lists buildings explicitly requesting retired ones to be included
- **THEN** the response contains both active and retired buildings

#### Scenario: Retrieving a building that does not exist
- **WHEN** an authenticated owner requests a building id that does not exist
- **THEN** the system responds with HTTP 404

### Requirement: Owner can update a building
The system SHALL allow an authenticated `owner` to update a building's display name, address, and utility rates. Changing a rate SHALL NOT alter any invoice already issued, because each invoice records the rate that was applied at the time it was created.

#### Scenario: Successful update
- **WHEN** an authenticated owner updates an existing building with valid values
- **THEN** the system saves the changes and responds with HTTP 200 and the updated building

#### Scenario: Updating a building that does not exist
- **WHEN** an authenticated owner updates a building id that does not exist
- **THEN** the system responds with HTTP 404

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
