## ADDED Requirements

### Requirement: A filter over data the owner entered is typed into, not scrolled

Where a filter's choices come from what the owner has ENTERED — buildings, rooms, wards,
cities — the control SHALL accept typing that narrows the list, while still offering the
whole list to somebody who does not know what they are looking for.

These lists grow without limit. A plain dropdown over fifty-eight room codes is a scroll
to reach one of them.

Where the choices are a FIXED set the system defines — a tenancy's status, a payment
method, what a fee is charged per — the control SHALL remain a plain dropdown. Those are
read rather than searched, and a text box in front of them invites typing something that
is not an option.

A filter SHALL be clearable back to "everything", and SHALL say what everything is
called. A typed string matching nothing SHALL say so rather than showing an empty box.

Where a choice is ambiguous on its own — a room code is unique only within its building —
the option SHALL carry what distinguishes it.

#### Scenario: Typing narrows

- **WHEN** the owner types part of a building's name into the building filter
- **THEN** only matching buildings are offered

#### Scenario: Nothing matches

- **WHEN** the owner types a string no entry matches
- **THEN** the control says nothing matches

#### Scenario: The whole list is still there

- **WHEN** the owner opens the filter without typing
- **THEN** every choice is offered

#### Scenario: Clearing

- **WHEN** the owner clears the filter
- **THEN** the list returns to everything, and the address no longer carries that filter

#### Scenario: A fixed set keeps its dropdown

- **WHEN** the owner opens a filter whose choices the system defines
- **THEN** it is a plain dropdown with no text entry
