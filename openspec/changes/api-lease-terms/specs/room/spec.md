## MODIFIED Requirements

### Requirement: Owner can update a room
The system SHALL allow an authenticated `owner` to update a room's code and base monthly rent. A room's base rent is what the room asks of a prospective tenant; it is not what any current tenant pays, because a lease records its own agreed rent when it is created.

Changing the base rent SHALL therefore affect only leases created afterwards. It SHALL NOT alter any invoice already issued, and SHALL NOT change what an existing lease is billed, whether that lease is running or finished.

#### Scenario: Successful update
- **WHEN** an authenticated owner updates an existing room with valid values
- **THEN** the system saves the changes and responds with HTTP 200 and the updated room

#### Scenario: Update to a duplicate active code
- **WHEN** an authenticated owner updates a room's code to one already used by another active room in the same building
- **THEN** the system responds with HTTP 409 and does not apply the change

#### Scenario: Updating a room that does not exist
- **WHEN** an authenticated owner updates a room id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: A running lease is unaffected by a rent change
- **WHEN** an authenticated owner changes the base rent of a room that has an active lease
- **THEN** that lease's agreed rent is unchanged, and invoices generated for it afterwards still charge the agreed rent

#### Scenario: A new lease picks up the changed rent
- **WHEN** an authenticated owner changes a room's base rent and then creates a new lease for that room without supplying an agreed rent
- **THEN** the new lease records the changed rent
