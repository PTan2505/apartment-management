## Purpose

Covers managing rooms from the browser: finding them by building and by code, creating and editing them, taking them in and out of service, and seeing the rooms that belong to a particular building.

## Requirements

### Requirement: The owner can see the rooms they manage

The application SHALL present the rooms the owner manages, showing for each the building it belongs to, its code, its rent, and whether it is in service.

A room SHALL always be shown with its building wherever its building is not already established by context. A room code identifies a room only within its building, so a code shown alone is ambiguous — two buildings may each hold a room with the same code.

Retired rooms SHALL be excluded unless explicitly asked for, and a retired room SHALL be visibly distinguished from one in service.

Loading SHALL be distinguishable from an empty result, and a failure to load SHALL be reported with the option to try again.

#### Scenario: Rooms are listed

- **WHEN** an owner opens the rooms screen
- **THEN** each room is shown with its building, its code, its rent, and whether it is in service

#### Scenario: Rooms sharing a code are distinguishable

- **WHEN** rooms in two different buildings share the same code and both are listed
- **THEN** each is shown with its own building, so they can be told apart

#### Scenario: Retired rooms are hidden by default

- **WHEN** an owner opens the rooms screen and some rooms have been retired
- **THEN** only rooms in service are shown

#### Scenario: Retired rooms can be shown

- **WHEN** an owner asks for retired rooms to be included
- **THEN** retired rooms appear alongside those in service, each marked as retired

#### Scenario: Loading is distinguishable from empty

- **WHEN** the rooms are still being fetched
- **THEN** the screen indicates that it is loading rather than showing an empty result

#### Scenario: The rooms cannot be fetched

- **WHEN** fetching the rooms fails
- **THEN** the screen reports the failure and offers to try again

### Requirement: Rent is displayed without being altered

Rent SHALL be displayed in a form that preserves it, including any fractional part, because rent is recorded to a fractional precision and rounding it for display shows the owner a figure they did not enter.

#### Scenario: Fractional rent keeps its fraction

- **WHEN** a room's rent has a fractional part
- **THEN** it is displayed including that fraction rather than rounded to a whole number

#### Scenario: Whole rent is not padded misleadingly

- **WHEN** a room's rent has no fractional part
- **THEN** it is displayed as a whole value

### Requirement: The owner can narrow rooms by building and by code

The application SHALL let the owner narrow the rooms to a single building, chosen from the buildings that exist rather than typed, and SHALL let them search room codes as free text.

Searching SHALL match any room whose code contains the text entered, matching the API rather than requiring an exact code. The two SHALL be combinable, and either SHALL be clearable.

Searching SHALL NOT issue a request for every keystroke, and SHALL NOT record a separate entry in the browser's history for every keystroke — otherwise returning to the previous view walks backwards through the search term one character at a time.

#### Scenario: Filtering by building

- **WHEN** an owner chooses a building
- **THEN** only that building's rooms are shown

#### Scenario: Searching by code

- **WHEN** an owner searches for text that several room codes contain
- **THEN** all rooms whose codes contain that text are shown, not only an exact match

#### Scenario: Searching within a building

- **WHEN** an owner chooses a building and searches a code
- **THEN** only that building's rooms whose codes contain the text are shown

#### Scenario: Typing does not flood the API

- **WHEN** an owner types a multi-character search term
- **THEN** the rooms are requested once the term settles rather than once per character

#### Scenario: Returning to the previous view after searching

- **WHEN** an owner types a multi-character search term and then uses the browser's back control once
- **THEN** the view before the search is restored, rather than the search term losing one character

#### Scenario: Clearing the filters

- **WHEN** an owner clears the building and the search
- **THEN** the full default list is shown again

#### Scenario: No rooms match

- **WHEN** an owner's building and search match no room
- **THEN** the screen says nothing matched and offers to clear the filters, rather than suggesting no rooms exist

### Requirement: The owner can create and edit a room

The application SHALL let the owner create a room in a building and edit an existing room's code and rent.

A room's building SHALL be chosen when the room is created and SHALL NOT be changeable afterwards, because the API does not support moving a room between buildings. The edit form SHALL therefore show the building without offering to change it.

Only buildings still in service SHALL be offered when creating, because the API refuses to add a room to a retired building.

The form SHALL require what the API requires and no more. Rent SHALL accept fractional values and SHALL NOT accept negative ones. Room code uniqueness SHALL NOT be judged by the form, because a code is unique only among rooms in service in one building and may be reused after a room is retired — only the API can decide it.

When the API rejects a submission, the reason SHALL be reported against the field it concerns where the API identifies one, and otherwise against the form.

#### Scenario: Creating a room

- **WHEN** an owner submits a valid new room in a chosen building
- **THEN** it is created and appears among that building's rooms without a reload

#### Scenario: Only buildings in service can be chosen

- **WHEN** an owner creates a room and some buildings have been retired
- **THEN** the retired buildings are not offered as choices

#### Scenario: A room's building is fixed after creation

- **WHEN** an owner edits an existing room
- **THEN** the building is shown but cannot be changed

#### Scenario: Editing a room

- **WHEN** an owner changes an existing room's code or rent and submits
- **THEN** the change is saved and the list reflects it without a reload

#### Scenario: Fractional rent is accepted

- **WHEN** an owner enters a rent with a fractional part
- **THEN** it is accepted and stored as entered

#### Scenario: Negative rent is rejected

- **WHEN** an owner enters a negative rent
- **THEN** the form reports it and the submission is not sent

#### Scenario: A duplicate room code is reported

- **WHEN** an owner creates a room whose code is already used by a room in service in the same building
- **THEN** the reason the API gave is reported and the room is not created

#### Scenario: A code freed by retirement can be reused

- **WHEN** an owner creates a room using the code of a retired room in the same building
- **THEN** the room is created, because the form does not judge uniqueness itself

#### Scenario: Submission in progress

- **WHEN** a submission is in flight
- **THEN** the form indicates it and a second submission of the same form is prevented

#### Scenario: The form is usable on a phone

- **WHEN** an owner opens the form on a narrow viewport
- **THEN** it is usable at that width, with every field reachable and the form dismissible

### Requirement: The owner can take a room out of service and back

The application SHALL let the owner retire a room and restore a retired one. Retiring SHALL require confirmation; restoring SHALL NOT.

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

- **WHEN** an owner restores a retired room whose code is free
- **THEN** it is marked in service again and reappears in the default list

#### Scenario: Restoring a room whose code was taken

- **WHEN** an owner restores a retired room whose code has since been taken by another room in service in the same building
- **THEN** the reason the API gave is reported and the room remains retired

#### Scenario: Restore needs no confirmation

- **WHEN** an owner restores a retired room whose code is free
- **THEN** it is restored without a confirmation step

### Requirement: A building's rooms are reachable from the building

The application SHALL provide a view of a single building showing the building itself and the rooms that belong to it.

Within that view a room's building is established by context, so each room SHALL NOT repeat it. The rooms SHALL otherwise behave as they do on the rooms screen, offering the same actions.

Creating a room from within a building SHALL create it in that building without asking which.

The view SHALL have its own address, so it can be opened directly and returned to.

A building that does not exist SHALL produce an explicit not-found result rather than an empty view.

#### Scenario: Opening a building

- **WHEN** an owner opens a building
- **THEN** the building's own details are shown together with the rooms that belong to it

#### Scenario: The building is not repeated on every room

- **WHEN** an owner views a building's rooms
- **THEN** each room shows its code, rent, and state without repeating the building

#### Scenario: The same actions are available

- **WHEN** an owner views a building's rooms
- **THEN** they can create, edit, retire, and restore rooms as they can on the rooms screen

#### Scenario: Creating a room from within a building

- **WHEN** an owner creates a room from a building's own view
- **THEN** the room is created in that building without the owner choosing one

#### Scenario: The view is addressable

- **WHEN** an owner opens a building's address directly
- **THEN** that building and its rooms are shown

#### Scenario: A building that does not exist

- **WHEN** an owner opens the address of a building that does not exist
- **THEN** an explicit not-found result is shown rather than an empty view

#### Scenario: A building with no rooms

- **WHEN** an owner opens a building that has no rooms
- **THEN** the screen says so and offers to add the first one

### Requirement: The rooms screen adapts to the viewport

Rooms SHALL be presented as a table on a wide viewport and as per-room cards on a narrow one, in both the rooms screen and a building's view.

Both presentations SHALL show the same rooms and offer the same actions, and neither SHALL cause the page to scroll horizontally at any supported width.

#### Scenario: Table on a wide viewport

- **WHEN** an owner views rooms on a wide viewport
- **THEN** they are presented as a table

#### Scenario: Cards on a narrow viewport

- **WHEN** an owner views rooms on a narrow viewport
- **THEN** they are presented as per-room cards rather than a narrowed table

#### Scenario: The same actions in both presentations

- **WHEN** an owner views rooms at either width
- **THEN** the same rooms are shown and the same actions are available for each

#### Scenario: No horizontal scrolling

- **WHEN** an owner views rooms at any supported width down to a small phone
- **THEN** the page does not scroll horizontally

### Requirement: A tenancy can be started from the room it is for

The rooms screen SHALL show whether each room is currently let, and SHALL offer to start a tenancy on a room that is not.

Signing an agreement begins with a particular room — the owner knows which one is empty before they know whose name goes on it. Requiring them to leave for the tenancies screen and find the room again inverts the order the work actually happens in.

The action SHALL NOT be offered on a room that is already let, nor on one that has been taken out of service, and the form it opens SHALL arrive with that room already chosen.

Whether a room is let SHALL be read from what the API reports about the room, not assembled by fetching tenancies.

#### Scenario: A vacant room offers a tenancy

- **WHEN** the owner views a room in service with no running tenancy
- **THEN** a way to start a tenancy on it is offered

#### Scenario: Starting from a room pre-selects it

- **WHEN** the owner starts a tenancy from a room
- **THEN** the form opens with that room already chosen

#### Scenario: An occupied room does not offer one

- **WHEN** the owner views a room that already has a running tenancy
- **THEN** no way to start another is offered, and the room is shown as let

#### Scenario: A retired room does not offer one

- **WHEN** the owner views a room that has been taken out of service
- **THEN** no way to start a tenancy on it is offered

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
