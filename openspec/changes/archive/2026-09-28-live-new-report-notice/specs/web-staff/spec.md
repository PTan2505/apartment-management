## ADDED Requirements

### Requirement: The application says a report has arrived, as it arrives

The shell SHALL show how many unread notices the signed-in account has, and
SHALL update that number when one arrives, without a reload and without the
person having to be on the report screen.

Arrival SHALL also be announced once, briefly, naming the room — a number that
changes in the corner of a screen nobody is looking at is not an announcement.

Selecting it SHALL show the notices themselves — what arrived, which room, and
when — and reading them SHALL be what clears the count. Selecting one SHALL open
the report it announces, whatever state that report is now in.

A notice for a report that has since been dealt with SHALL say so rather than
disappearing. It is a record of something that happened, and a list that erases
what was handled cannot answer "was anything reported while I was away".

Where the connection is not available — refused, dropped, or never established
— the count SHALL still be correct on arriving at a screen and SHALL be
refreshed periodically. The live connection makes it immediate; it is not what
makes it right.

#### Scenario: A report arrives while the staff member is elsewhere

- **WHEN** a tenant raises a report while a manager is reading a tenancy
- **THEN** the count rises, and a brief notice names the room

#### Scenario: Reading the notices

- **WHEN** they open the list of notices
- **THEN** the notices are shown newest first, and the count returns to zero

#### Scenario: A notice for a report already dealt with

- **WHEN** a notice announces a report that has since been closed
- **THEN** it is still listed, marked as dealt with, and still opens that report

#### Scenario: The connection is unavailable

- **WHEN** the live connection cannot be established
- **THEN** the count is still shown correctly and refreshes as the person moves around the application

#### Scenario: The session ends

- **WHEN** the person signs out
- **THEN** the connection is closed and no further notice appears
