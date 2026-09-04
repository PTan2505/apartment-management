## ADDED Requirements

### Requirement: The room form takes the meter reading the room stands at

When creating a room, the application SHALL offer a field for the electricity meter's current reading, and SHALL explain what it is for.

It is not obvious why a room needs a meter reading before anybody lives in it, and an unexplained number field gets skipped. What it buys is concrete: without it, every month the room stands empty before its first tenancy has electricity the owner pays for and cannot record anywhere.

The field SHALL be optional and SHALL NOT block creating a room. An owner who does not have the figure to hand should not be prevented from adding the room; the consequence — that the room's empty months cannot be costed until it is first let — is theirs to accept.

The application SHALL make clear that it is a **starting point**, not a charge. Nothing is billed from this figure; every charge is a difference between it and a later reading.

The application SHALL NOT offer it when editing a room. The figure describes the moment the room was added, and once any tenancy or vacancy record exists the room's position comes from those instead — an editable field here would look like a way to correct history that it is not.

#### Scenario: Recording the meter when adding a room

- **WHEN** the owner creates a room and enters the meter's current reading
- **THEN** the room records it, and the room's empty months can be costed from it

#### Scenario: Adding a room without the reading

- **WHEN** the owner creates a room without entering a reading
- **THEN** the room is created

#### Scenario: The field explains itself

- **WHEN** the owner is filling in the room form
- **THEN** the screen says the reading is a starting point for measuring later consumption, not something that will be charged

#### Scenario: Editing a room

- **WHEN** the owner edits an existing room
- **THEN** no meter reading field is offered
