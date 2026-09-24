## ADDED Requirements

### Requirement: Signing asks when before it asks where

The signing form SHALL ask for the date the tenant moves in BEFORE it offers a room, and the rooms it offers SHALL be those that can take a tenancy beginning on that date.

Asked in the other order, the form offers the rooms that are free TODAY — which is neither the question nor the answer. A room whose tenant leaves at the end of the month cannot be chosen for a tenancy starting after that, and a room free today can be chosen for a start date it cannot take, with the refusal arriving only after the whole form has been filled in.

Until a date is chosen the room list SHALL be empty and SHALL say that the date comes first, rather than offering a list that is about to change.

When the date changes, the rooms SHALL be asked for again. A room already chosen that the new date cannot take SHALL be cleared, and the screen SHALL say so — carrying it silently into a submission the API will refuse moves the refusal to the worst possible moment.

Where the form is opened from a room that is already chosen, the room stands and the date SHALL still be asked for; the form SHALL NOT drop a room the owner arrived with.

#### Scenario: The date comes first

- **WHEN** the owner opens the signing form
- **THEN** the move-in date is asked for above the room, and no rooms are offered until it is filled in

#### Scenario: Rooms that fit the date

- **WHEN** the owner enters a move-in date
- **THEN** the rooms offered are those free on that date, including one whose previous tenancy ends exactly then

#### Scenario: Changing the date changes the rooms

- **WHEN** the owner changes the move-in date after choosing a room
- **THEN** the room list is asked for again for the new date

#### Scenario: A chosen room that no longer fits

- **WHEN** the new date cannot take the room already chosen
- **THEN** the room is cleared and the screen says why, before anything is submitted

#### Scenario: Arriving from a room

- **WHEN** the owner opens the form from a room, so the room is already chosen
- **THEN** that room stays chosen and the date is still asked for
