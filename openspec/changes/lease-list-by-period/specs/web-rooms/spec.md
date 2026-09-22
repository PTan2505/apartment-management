## ADDED Requirements

### Requirement: A let room shows when it comes free and opens its tenancy

The rooms screen SHALL show, for every room currently let, the day it comes free — the recorded move-out where there is one, the agreed end otherwise.

"Đang thuê" answers whether the room is free today. It does not answer the question an owner actually has in front of a waiting tenant: WHEN. Without the date, the only way to find out is to open the tenancy list and look the room up there.

Opening a room that is let SHALL open the TENANCY holding it, not the room's own record. There is nothing on a room's record that an owner clicking a let room is looking for — the terms, the tenant, the bills and the dates are all on the tenancy, and the room is how they got there.

A room that is NOT let SHALL keep the behaviour it has: it shows no date, and opening it does whatever it does today.

The date SHALL be shown in the same form as elsewhere in the application, and SHALL make clear it is the day the room frees rather than a day already passed.

#### Scenario: A let room shows its end date

- **WHEN** the owner opens the rooms screen and a room is let
- **THEN** that row shows the day the room comes free

#### Scenario: Opening a let room

- **WHEN** the owner opens a room that is let
- **THEN** the tenancy holding it is opened

#### Scenario: A vacant room

- **WHEN** a room is not let
- **THEN** no date is shown for it and opening it behaves as before

#### Scenario: A tenancy that ended early

- **WHEN** the tenancy holding a room recorded a move-out before its agreed end
- **THEN** the room shows the move-out date
