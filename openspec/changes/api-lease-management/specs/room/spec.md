## MODIFIED Requirements

### Requirement: Owner can retire and restore a room
The system SHALL allow an authenticated `owner` to retire a room by marking it inactive, and to restore a retired room. The system SHALL NOT support permanently deleting a room, so that leases and invoices referencing it retain their history. The system SHALL reject retiring a room that has an active lease, so an occupied room cannot be taken out of service while a tenant still holds it.

#### Scenario: Retiring a room
- **WHEN** an authenticated owner retires an active room with no active lease
- **THEN** the room is marked inactive, is excluded from default room listings, and its record still exists

#### Scenario: Retiring an occupied room
- **WHEN** an authenticated owner retires a room that has an active lease
- **THEN** the system responds with HTTP 409 and the room remains active

#### Scenario: Retiring a room after its tenant moves out
- **WHEN** an authenticated owner retires a room whose only lease has recorded a move-out
- **THEN** the room is marked inactive

#### Scenario: Restoring a retired room
- **WHEN** an authenticated owner restores a retired room whose code is not in use by another active room in the same building
- **THEN** the room is marked active again and reappears in default room listings

#### Scenario: Restoring a room whose code was reused
- **WHEN** an authenticated owner restores a retired room whose code is now used by another active room in the same building
- **THEN** the system responds with HTTP 409 and the room remains retired
