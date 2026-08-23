## MODIFIED Requirements

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
