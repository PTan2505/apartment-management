## ADDED Requirements

### Requirement: An expense may name the damage report it paid for

An expense SHALL be able to record which damage report it is the cost of, and at most
one expense SHALL name any given report.

The reference exists so a repair's cost has a single home. Without it the same figure
would be written on the report and on the expense, and nothing would keep the two
agreeing.

An expense naming a report SHALL otherwise be an ordinary expense: it appears in
listings, in the month's total, and in its category exactly as one entered by hand.

An expense naming no report SHALL remain valid and unchanged. Every expense recorded
before this existed names none.

#### Scenario: One expense per report

- **WHEN** a second expense is written naming a report that already has one
- **THEN** the write is refused and the existing expense stands

#### Scenario: It behaves as an ordinary expense

- **WHEN** expenses are listed for the building and month of a costed repair
- **THEN** that expense is among them, with its amount and its repair category

#### Scenario: Expenses that name nothing

- **WHEN** an expense is recorded by hand with no report
- **THEN** it is accepted, exactly as before

## MODIFIED Requirements

### Requirement: Expense endpoints require an authenticated owner

The system SHALL reject any expense request that is unauthenticated.

READING expenses SHALL be open to a `manager` within the buildings they cover: they run
those buildings and have to see what running them costs.

WRITING SHALL require the `owner` — creating an expense, correcting one, deleting one,
and recording a vacant room's electricity. What the business spends is a statement about
the business, of the same kind as declaring money received, which a manager already may
not make. It also closes a hole that would otherwise make the rule above decorative: a
repair cost restricted to the owner at the report would sit in the expenses list as an
ordinary row for a manager to edit.

A `maintenance` account SHALL be refused every expense endpoint, reading included.

#### Scenario: Unauthenticated request

- **WHEN** a request to any expense endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request

- **WHEN** a request to any expense endpoint carries a valid access token for a role that is neither `owner` nor `manager`
- **THEN** the system responds with HTTP 403 and does not process the request

#### Scenario: A manager reads

- **WHEN** a manager lists or retrieves an expense of a building they cover
- **THEN** it is returned

#### Scenario: A manager writes

- **WHEN** a manager creates, updates or deletes an expense, or records vacancy electricity
- **THEN** the system responds with HTTP 403 and nothing is written

#### Scenario: Maintenance

- **WHEN** a maintenance account calls any expense endpoint
- **THEN** the system responds with HTTP 403
