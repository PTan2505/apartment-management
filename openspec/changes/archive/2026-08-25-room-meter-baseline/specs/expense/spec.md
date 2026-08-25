## MODIFIED Requirements

### Requirement: The system reports which rooms need their vacancy electricity recorded for a month

The system SHALL report, for a given month, every room that stood empty at that month's end and has no vacancy electricity recorded for it, together with the meter reading each would open from.

This is a cost the owner does not know is missing. Rent and utilities announce themselves — a tenant is billed, or is not — but a room standing empty runs its meter quietly and produces a cost nobody thought to look for. Nothing in the system asks about it, so it is simply never recorded, and every revenue report is too flattering by that amount.

Working it out is not something a caller can do cheaply: it means finding the rooms no tenancy covered at that month's end, subtracting those already recorded for it, and resolving one meter reading per room. Assembled by a client that is a request per room and a second copy of a rule this module already owns — the same rule that refuses to record a vacancy for a month a tenancy covered.

What is reported SHALL be exactly the work outstanding: a room SHALL leave the result as soon as its vacancy is recorded for that month, and SHALL NOT appear where recording one would be refused.

**Occupancy SHALL be judged at the month's end, not across the month.** A room let mid-month was occupied when the month closed, and its whole month of consumption belongs on the tenant's invoice — the system already refuses a vacancy record in that case, and reporting the room as outstanding would offer work that cannot be done.

The opening reading SHALL be the same figure the recorded cost would be computed from. A figure that merely resembles it would let a caller present a plausible wrong number for a person to check their typing against.

**A room that has never been let SHALL be reported, provided it has a known meter position** — which it now has whenever it was created with an opening reading. Such a room is exactly the case this exists for: it stands empty, its meter runs, and until it is first let nothing else in the system will ever produce a reading for it. Excluding it, as this requirement previously did, silently discarded every month of that cost.

**A room with no known reading at all SHALL still NOT be reported.** Consumption is a difference, and a room with nothing recorded anywhere has nothing to subtract from; the system refuses to record a vacancy for it, and offering a row that cannot be acted on is worse than omitting it. That is now a narrow case — a room added before opening readings were recorded, or one created without stating a figure — rather than the ordinary state of every new room.

The result SHALL identify each room and its building, and SHALL be narrowable by building.

Retired rooms SHALL be excluded. A room taken out of service is not one the owner is waiting to let, and its meter is not their running cost.

#### Scenario: What is outstanding for a month

- **WHEN** an authenticated owner asks which rooms need their vacancy electricity recorded for a month
- **THEN** the system reports every active room that no tenancy covered at that month's end and that has no vacancy record for it, each with its building and the reading it would open from

#### Scenario: A room already recorded is not reported

- **WHEN** a room already has a month-end vacancy record for that month
- **THEN** it is not reported as outstanding

#### Scenario: A room a tenancy covered at the month's end

- **WHEN** a room was let on the last day of that month
- **THEN** it is not reported, because that month's consumption belongs on the tenant's invoice

#### Scenario: A room let partway through the month

- **WHEN** a tenancy began mid-month and was still running at the month's end
- **THEN** the room is not reported, because recording a vacancy for it would be refused

#### Scenario: A room whose tenancy ended before the month closed

- **WHEN** a tenancy recorded a move-out before that month's last day
- **THEN** the room is reported, because it stood empty when the month closed

#### Scenario: A room that has never been let

- **WHEN** a room was created with an opening reading and has never been let
- **THEN** it is reported, opening from that reading, because it stood empty all month and its meter ran

#### Scenario: A retired room

- **WHEN** a room has been retired
- **THEN** it is not reported, because it is not a room the owner is waiting to let

#### Scenario: The opening reading matches what the cost would use

- **WHEN** a room's most recent known reading comes from a previous tenancy's closing reading, an earlier vacancy record, or its own opening figure
- **THEN** that is the reading reported

#### Scenario: A room with no reading at all

- **WHEN** a room has no opening reading recorded and has never been let
- **THEN** it is not reported, because there is nothing to measure consumption against and recording one would be refused

#### Scenario: Narrowed to one building

- **WHEN** an authenticated owner asks what is outstanding within a named building
- **THEN** only rooms in that building are reported

#### Scenario: Nothing outstanding

- **WHEN** every empty room has been recorded for that month
- **THEN** the system reports that nothing is outstanding, rather than an error

#### Scenario: Requires an authenticated owner

- **WHEN** an unauthenticated request asks what is outstanding
- **THEN** the system responds with HTTP 401
