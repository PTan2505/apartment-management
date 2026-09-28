# damage-report Specification

## Purpose

Something in a room is broken, and what happens between the tenant saying so and it
being fixed.

A tenant raises it from the link they already pay through, so nothing asks them where
they live. From there it is the building's staff who see it, schedule it, and close it —
and who are told the moment one arrives, rather than finding out when they next look.

## Requirements
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

### Requirement: A new report is announced to the people who can act on it

When a damage report is raised, the system SHALL send an event to every account
entitled to see it: the `manager` and `maintenance` accounts assigned to that
building, and the `owner`.

The event SHALL carry the report's id, its building and room, and when it was
raised — enough to say what arrived and to open it, and nothing that the report
endpoint does not already return to that account.

It SHALL be sent after the report is committed. An event about a row that a
failed transaction rolled back is a notice about something that never happened.

Staff of other buildings SHALL NOT receive it. The event is addressed, not
broadcast — a notice is a small leak of the same kind a listing would be.

#### Scenario: Staff of the building are told

- **WHEN** a tenant raises a report
- **THEN** each manager and maintenance account assigned to that building receives an event, and so does the owner

#### Scenario: Staff of other buildings are not

- **WHEN** a report is raised in a building a staff account does not cover
- **THEN** that account receives nothing

#### Scenario: Nobody is connected

- **WHEN** no entitled account is connected at that moment
- **THEN** the report is recorded as usual and the count they see on their next visit includes it

#### Scenario: The write fails

- **WHEN** recording the report fails
- **THEN** no event is sent

### Requirement: A report raises a notice for each person who should know

When a damage report is raised, the system SHALL record a notice for each
account entitled to act on it at that moment — the `manager` and `maintenance`
accounts assigned to that building, and the `owner` — and SHALL report how many
of an account's notices are unread.

A notice is a record of something that HAPPENED. It SHALL therefore stay after
the report it announces has been scheduled and after it has been closed: "a
report came in at nine and was dealt with" is the thing the notice says, and it
stays true.

Recipients SHALL be decided when the report is raised. Somebody assigned to the
building afterwards SHALL NOT receive notices for what arrived before they
covered it — they see those reports on the report screen, which is where
outstanding work lives. A notice answers "what happened while I was away", not
"what is left to do".

Reading SHALL be an account's own act, recorded per account: the same report
read by one manager stays unread for the other.

#### Scenario: Everyone who covers the building is told

- **WHEN** a tenant raises a report
- **THEN** a notice is recorded for each manager and maintenance account assigned to that building, and for the owner

#### Scenario: The notice outlives the report

- **WHEN** the report is closed as done
- **THEN** the notice is still listed, and still says a report arrived

#### Scenario: Read by one person

- **WHEN** one manager reads their notices
- **THEN** theirs are marked read and another manager's are not

#### Scenario: Assigned afterwards

- **WHEN** an owner assigns a staff account to a building that already has reports
- **THEN** no notice is created for what arrived earlier; those reports are on the report screen

#### Scenario: Staff of other buildings

- **WHEN** a report is raised in a building a staff account does not cover
- **THEN** no notice is recorded for that account

