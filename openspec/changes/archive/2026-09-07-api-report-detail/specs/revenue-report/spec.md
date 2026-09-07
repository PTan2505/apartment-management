## ADDED Requirements

### Requirement: The report can name the rooms behind its figures

The report SHALL be able to report, for each building and month it covers, the rooms that produced those figures — for each room, the tenancy responsible, the person responsible for it, what was billed, what has been collected, and what remains outstanding.

A total answers "how much", and every question an owner asks next is "which". Today that question is answered by leaving the report, filtering an invoice list to the same building and month, and holding the total in one's head while doing it. The two sources can also disagree — an invoice list filtered by period is keyed differently from a report keyed on the month billed — so the reader is left comparing two things that were never the same figure.

The room figures SHALL be keyed the same way as the month figures they belong to. A room detail keyed on anything else would not add up to the total it sits beneath, and a breakdown that does not sum to its own total is worse than no breakdown.

A room with a tenancy but nothing billed in that month SHALL be reported with zeroes rather than omitted, for the same reason an empty month is: an absence reads as data that failed to load.

#### Scenario: Rooms behind a month's figures

- **WHEN** an authenticated owner requests the report with room detail
- **THEN** each building's month reports the rooms it covers, each with its tenancy, the person responsible, and what was billed, collected and outstanding

#### Scenario: The detail sums to the total

- **WHEN** a month reports both a billed total and its room detail
- **THEN** the room billed figures sum exactly to that total

#### Scenario: A room with no activity in the month

- **WHEN** a room was tenanted for the month but nothing was billed against it
- **THEN** it appears with zeroes rather than being left out

#### Scenario: A room whose tenancy has no recorded tenant

- **WHEN** the tenancy responsible has no person recorded against it
- **THEN** the room is still reported, and the absent tenant is reported as absent rather than as an empty name

### Requirement: The detail is asked for, not imposed

The report SHALL treat room-level detail as something a caller requests, and SHALL NOT include it unless asked.

A report over twelve months and several buildings carries a few dozen figures; the same report with every room carries thousands. A caller that wants a summary should not pay to transfer, parse and discard a room list, and a screen that opens with totals should not wait on one.

#### Scenario: A summary request

- **WHEN** a caller requests the report without asking for room detail
- **THEN** the response carries the same totals it does today, and no room detail

#### Scenario: A detailed request

- **WHEN** a caller asks for room detail
- **THEN** the response carries it alongside the same totals

### Requirement: A figure states how many things it counts

The report SHALL state, for each building and month, how many rooms were LET, how many of those were billed and owe nothing, how many were billed and owe something, and how many were billed nothing at all. It SHALL state how many expense records make up each expense total.

A sum with no count behind it cannot be sanity-checked. An owner who knows twenty-eight rooms are let, and reads a figure covering twenty-two, has learned something the figure alone does not say — and learning it by counting rows is the work this report exists to remove.

A room let but not billed SHALL be counted on its own, and SHALL NOT be folded into the collected count. It owes nothing, so the arithmetic would work — and a building where five rooms were never invoiced would be reported as having collected from them, which is the opposite of what an owner needs to notice.

The counts SHALL be consistent with the figures they accompany: collected, outstanding and unbilled SHALL sum to the room count.

#### Scenario: Counts beside the figures

- **WHEN** an authenticated owner reads a month's figures for a building
- **THEN** the number of rooms let, the number collected, the number outstanding and the number billed nothing are reported with them

#### Scenario: The counts agree with themselves

- **WHEN** a month reports a room count with its collected, outstanding and unbilled counts
- **THEN** the latter three sum to the former

#### Scenario: A room let but never invoiced

- **WHEN** a room was let for the month and nothing was billed against it
- **THEN** it is counted as unbilled, and NOT as collected

#### Scenario: How many vouchers a cost is made of

- **WHEN** a month reports what was spent
- **THEN** it also reports how many expense records that total is made of
