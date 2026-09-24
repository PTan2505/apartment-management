## ADDED Requirements

### Requirement: Rooms can be listed by the date they are free from

The system SHALL allow an authenticated `owner` to list rooms available on a NAMED DATE: rooms in service, holding no open tenancy, whose most recent tenancy ended on or before that date.

"Vacant" answers a different question — free right now — and it is the wrong question when signing. A room whose tenant leaves on the 30th can take a tenancy beginning the 1st, and a room free today cannot take one beginning last month. A caller that asks "which rooms are free now" while the owner is signing for November gets both answers wrong in the same list.

The date SHALL be compared the way the tenancy rule compares it: an ending date is the first day no longer covered, so a room whose previous tenancy ends exactly on the named date IS available — it abuts, with neither gap nor overlap.

A CANCELLED tenancy SHALL be ignored in this comparison. It covered no days, so its dates hold no room; counting them would hide the very room a cancellation was performed to free.

This filter SHALL be combinable with the others, and SHALL NOT change what the listing returns when it is not given.

#### Scenario: A room whose tenancy ends before the date

- **WHEN** an owner lists rooms available on a date after the room's last tenancy ended
- **THEN** that room is listed

#### Scenario: A room whose tenancy ends exactly on the date

- **WHEN** an owner lists rooms available on the very day the room's last tenancy ends
- **THEN** that room is listed, because an ending date is the first day no longer covered

#### Scenario: A room still let on that date

- **WHEN** an owner lists rooms available on a date while a tenancy of that room is still running
- **THEN** that room is not listed

#### Scenario: A room whose last tenancy ends after the date

- **WHEN** an owner lists rooms available on a date earlier than the day the room's last tenancy ends
- **THEN** that room is not listed

#### Scenario: A cancelled tenancy holds no room

- **WHEN** a room's only tenancy was cancelled
- **THEN** the room is listed as available on any date

#### Scenario: A retired room is never available

- **WHEN** an owner lists rooms available on a date
- **THEN** rooms taken out of service are not listed

#### Scenario: The filter is optional

- **WHEN** an owner lists rooms without naming a date
- **THEN** the listing behaves exactly as it did before
