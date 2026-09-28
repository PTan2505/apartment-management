## ADDED Requirements

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
