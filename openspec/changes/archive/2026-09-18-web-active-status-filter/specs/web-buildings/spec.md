## ADDED Requirements

### Requirement: The buildings screen filters by in-service status
The screen SHALL offer the in-service status as a choice of three — everything, only what is in service, only what is out of service — in one control rather than a switch that can only widen the list.

The default SHALL be everything, so a building taken out of service is visible until the owner narrows the list rather than hidden until they think to look.

The choice SHALL live in the page address alongside the other filters, so a filtered view can be returned to, and SHALL apply to the location choices offered beside it, which must not offer a location that yields nothing.

#### Scenario: Default shows everything
- **WHEN** the owner opens the buildings screen
- **THEN** buildings in service and out of service are both listed, and the status control reads as everything

#### Scenario: Narrowing to what is out of service
- **WHEN** the owner chooses to see only what is out of service
- **THEN** only those buildings are listed

#### Scenario: The choice survives a reload
- **WHEN** the owner chooses a status and reloads the page
- **THEN** the same status is still chosen and the same buildings are listed
