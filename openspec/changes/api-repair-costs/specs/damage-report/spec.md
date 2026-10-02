## ADDED Requirements

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
