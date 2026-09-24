## REMOVED Requirements

### Requirement: The owner can take a room out of service and back

**Reason**: It required that restoring a room NOT be confirmed. That is the decision being reversed, so the requirement is replaced rather than amended — a scenario asserting "restored without a confirmation step" cannot survive alongside one that asserts the opposite.

**Migration**: None. The same screen offers the same two actions; restoring now asks first. Replaced by "Taking a room out of service and putting it back are both confirmed" below, which keeps every other scenario of the removed requirement.

## ADDED Requirements

### Requirement: Taking a room out of service and putting it back are both confirmed

The application SHALL let the owner retire a room and restore a retired one, and SHALL confirm both before sending anything: retiring because the room leaves the default list, restoring because the room returns to the lists and becomes available to sign a tenancy against. Restoring is reversible, which is not the same as harmless — it is offered beside ordinary actions, and an owner who has to undo a mis-click has already been surprised.

Two distinct refusals are possible, and each SHALL be reported in the API's own words rather than as a generic failure, because each is an expected outcome of a reasonable action:

- retiring a room that still has an active lease
- restoring a room whose code has since been taken by another room in service

#### Scenario: Retiring a room

- **WHEN** an owner retires a room and confirms
- **THEN** the room is marked retired and leaves the default list

#### Scenario: Retiring is confirmed first

- **WHEN** an owner starts to retire a room and does not confirm
- **THEN** the room remains in service

#### Scenario: Retiring a room that still has a tenant

- **WHEN** an owner confirms retiring a room that has an active lease
- **THEN** the reason the API gave is reported and the room remains in service

#### Scenario: Restoring a retired room

- **WHEN** an owner restores a retired room whose code is free and confirms
- **THEN** it is marked in service again and reappears in the default list

#### Scenario: Restoring a room whose code was taken

- **WHEN** an owner confirms restoring a retired room whose code has since been taken by another room in service in the same building
- **THEN** the reason the API gave is reported and the room remains retired

#### Scenario: Restoring is confirmed first

- **WHEN** an owner starts to restore a retired room and does not confirm
- **THEN** no request is sent and the room remains retired


### Requirement: A change to a room's rent is confirmed before it is saved

The application SHALL ask the owner to confirm saving a room whose rent has changed, showing the previous rent and the new one, and SHALL say that the new rent applies to tenancies signed from now on rather than to one already running.

Saving a room whose rent is unchanged SHALL NOT be confirmed.

#### Scenario: Saving a changed rent

- **WHEN** an owner changes a room's rent and saves
- **THEN** a confirmation shows the rent as old and new, and nothing is sent until it is confirmed

#### Scenario: Saving without touching the rent

- **WHEN** an owner edits a room without changing its rent and saves
- **THEN** the change is saved without a confirmation step

#### Scenario: The confirmation says what the new rent applies to

- **WHEN** an owner is asked to confirm a changed rent
- **THEN** the confirmation says it applies to tenancies signed from now on, not to a running one
