## ADDED Requirements

### Requirement: A let room names the tenancy holding it and when it frees up

A room reported as let SHALL also report the IDENTITY of the tenancy holding it and the day that tenancy covers to — the recorded move-out where there is one, the agreed end otherwise. A room that is not let SHALL report neither.

A room has said only WHETHER it is let, and deliberately: a room's response must not carry the tenancy's terms, its tenant or its rent, because that is the tenancy's own record and a copy of it goes stale on the first change.

An identifier and a date are not that copy. They are the two things a rooms screen cannot answer without them — "when does this room come free" and "which tenancy is in it" — and the alternative is a request per row, which is what a listing exists to avoid.

Nothing further SHALL be added. No tenant name, no rent, no status of the tenancy: each is available by following the id, and each would be a second place for a fact that already has one.

#### Scenario: A let room reports its tenancy

- **WHEN** an authenticated owner retrieves a room with a running tenancy
- **THEN** the response names that tenancy's id and the day it covers to

#### Scenario: A tenancy that ended early

- **WHEN** the tenancy holding a room recorded a move-out before its agreed end
- **THEN** the room reports the move-out date, because that is the day it comes free

#### Scenario: A vacant room reports neither

- **WHEN** an authenticated owner retrieves a room with no running tenancy
- **THEN** the response carries no tenancy id and no end date

#### Scenario: Listed rooms report it too

- **WHEN** an authenticated owner lists rooms
- **THEN** each let room carries the same two facts it carries when retrieved singly

#### Scenario: Nothing else comes with it

- **WHEN** a room reports the tenancy holding it
- **THEN** it carries no tenant, no rent and no terms from that tenancy
