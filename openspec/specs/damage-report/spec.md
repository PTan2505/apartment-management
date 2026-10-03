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

### Requirement: A repair records what it cost, against the owner

A damage report SHALL be able to carry what the repair cost, and that cost SHALL be
recorded as an expense of the room the report belongs to, categorised as a repair.

The cost is the OWNER's. A tenant reports a fault; nothing about the report bills them
for it, and the amount reaches the owner's expenses rather than any invoice.

The amount SHALL be held in exactly one place — the expense row — and the report SHALL
carry no amount of its own. Whether a report has been costed SHALL be answered by
whether such an expense exists. Two records of one figure are two records that can
disagree, and no reader could then tell which was wrong.

A report SHALL have at most ONE repair expense. Recording a cost for a report that
already has one SHALL replace the figure rather than add a second, so one repair can
never be counted twice in a month's total.

The expense SHALL take its building and room from the report's tenancy, and SHALL date
to the repair rather than to the moment somebody typed it: by default the day the report
was closed, which the owner may change. Recording it late therefore changes the month
the repair belongs to, which is how every other expense already behaves.

Only the `owner` SHALL record, change or remove it. A `manager` and a `maintenance`
account SHALL be refused, and SHALL still see the figure on reports they can already
read — the person who did the work has to be able to check what was entered for it.

A report need not have a cost. An absent cost SHALL mean nobody has stated one, which is
distinct from a cost of zero — a repair that cost nothing is a fact somebody recorded.

#### Scenario: The owner records a repair cost

- **WHEN** the owner records a cost against a closed report
- **THEN** an expense exists for that report's room, categorised as a repair, dated to the report's closing day, for that amount

#### Scenario: The report carries no amount of its own

- **WHEN** a report that has been costed is retrieved
- **THEN** the amount it reports is the one on its expense, and removing that expense leaves the report uncosted

#### Scenario: Recording a cost twice

- **WHEN** the owner records a cost for a report that already has one
- **THEN** the existing expense is updated and no second expense is created

#### Scenario: Correcting the amount

- **WHEN** the owner changes a recorded cost
- **THEN** the expense carries the new amount, and the month's expense total moves with it

#### Scenario: A manager tries

- **WHEN** a manager records, changes or removes a repair cost
- **THEN** the system responds with HTTP 403 and nothing is written

#### Scenario: Maintenance tries

- **WHEN** a maintenance account records a repair cost
- **THEN** the system responds with HTTP 403 and nothing is written

#### Scenario: Maintenance reads one

- **WHEN** a maintenance account reads a report in a building it covers that has been costed
- **THEN** the amount is returned with the report

#### Scenario: Dating the expense

- **WHEN** the owner records a cost without naming a date
- **THEN** the expense is dated to the day the report was closed

#### Scenario: A cost of nothing

- **WHEN** the owner records a cost of zero
- **THEN** an expense of zero exists, distinct from a report nobody has costed

#### Scenario: It reaches the revenue report

- **WHEN** a month's revenue is reported for a building with a costed repair in it
- **THEN** that amount is included in the month's expenses and in the repair category, and the net figures are reduced by it

