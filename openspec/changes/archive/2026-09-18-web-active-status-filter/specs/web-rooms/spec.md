## ADDED Requirements

### Requirement: The rooms screen filters by in-service status
The screen SHALL offer the in-service status as a choice of three — everything, only what is in service, only what is out of service — in one control, defaulting to everything, and SHALL keep that choice in the page address alongside the building and search filters.

#### Scenario: Default shows everything
- **WHEN** the owner opens the rooms screen
- **THEN** rooms in service and out of service are both listed

#### Scenario: Narrowing to what is out of service
- **WHEN** the owner chooses to see only what is out of service
- **THEN** only retired rooms are listed

#### Scenario: The choice survives a reload
- **WHEN** the owner chooses a status and reloads the page
- **THEN** the same status is still chosen and the same rooms are listed
