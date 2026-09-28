## ADDED Requirements

### Requirement: A tenant can report something broken

The system SHALL accept a damage report from a valid portal token, recorded
against the tenancy that token was issued for, carrying what is broken in the
tenant's own words and optionally photographs of it.

The report SHALL take its room and building from the tenancy rather than from
the request. A tenant naming a room is a tenant who can name somebody else's.

A report SHALL be accepted from a tenancy that has ended. Something found broken
after a move-out is exactly when a report is raised, and the deposit settlement
is what it bears on.

#### Scenario: Raising a report

- **WHEN** a tenant submits a description through their portal link
- **THEN** a report is recorded against that tenancy, in the state "new"

#### Scenario: The room is not the tenant's to choose

- **WHEN** the request names a room
- **THEN** it is ignored; the report belongs to the tenancy's own room

#### Scenario: An empty description

- **WHEN** a report is submitted with nothing said
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: Without a valid link

- **WHEN** a report is submitted with no token, or a revoked one
- **THEN** the system responds as it does for every other portal request with that token, and records nothing

### Requirement: A report moves from new, to scheduled, to done

A report SHALL be in exactly one of three states: `new`, `scheduled`, `done`.

Recording an appointment SHALL move it to `scheduled` and SHALL keep the date
and time agreed, together with a note of what was agreed. An appointment may be
changed while the report is open; the report SHALL keep when it was last
changed and by whom.

Closing a report SHALL move it to `done` and SHALL record when, by whom, and
what was done. A report SHALL be closable from either state: some things are
fixed on the spot without an appointment ever being made.

A report that is `done` SHALL NOT be reopened. What broke again is a new report,
and a shared record of "it happened twice" is worth more than one row edited
back and forth.

#### Scenario: Recording an appointment

- **WHEN** staff record an appointment on a new report
- **THEN** it is scheduled, carrying that date and who recorded it

#### Scenario: Moving an appointment

- **WHEN** staff change the appointment on a scheduled report
- **THEN** the new date replaces it, and the report records when it was last changed

#### Scenario: Closing it

- **WHEN** staff close a report with a note of what was done
- **THEN** it is done, carrying that note, who closed it and when

#### Scenario: Fixed without an appointment

- **WHEN** staff close a report that was never scheduled
- **THEN** it is done, and no appointment is invented for it

#### Scenario: A closed report

- **WHEN** staff try to change a report that is done
- **THEN** the system responds with HTTP 409 and nothing changes

### Requirement: Reports are seen by the building's staff and the owner

The system SHALL return a report to an `owner`, and to a `manager` or
`maintenance` assigned to the building the report belongs to. It SHALL answer as
though the report does not exist for staff of any other building.

The listing SHALL be filterable by state and by building, and SHALL put the
oldest OPEN report first. A report that has been waiting three weeks is the one
that matters, and newest-first buries it.

A report SHALL carry what is needed to act on it without reaching anywhere else:
the room and building, the tenant's name and phone number, what they said, and
its history.

#### Scenario: Staff of the building

- **WHEN** a maintenance account assigned to a building lists reports
- **THEN** that building's reports are returned, oldest open first

#### Scenario: Staff of another building

- **WHEN** they retrieve a report belonging to a building they do not cover
- **THEN** the system responds with HTTP 404

#### Scenario: The owner

- **WHEN** the owner lists reports
- **THEN** every building's reports are returned

#### Scenario: What a report carries

- **WHEN** staff open a report
- **THEN** it names the room, the building, the person who raised it and how to reach them
