## ADDED Requirements

### Requirement: The rooms behind a month's figures are readable on the report

The application SHALL show, for each month it reports, the rooms that produced those figures — each with the room, the person responsible for the tenancy, and what was billed, collected and outstanding.

A total answers "how much" and the next question is always "which". Answering it by leaving for the invoice list and narrowing it back to the same building and month is the reader doing the screen's work, and the two sources can legitimately disagree: an invoice list filtered by period is keyed differently from a report keyed on the month billed.

A room whose tenancy has nobody recorded SHALL be shown as having none, rather than with an empty name. It is a state the system allows, and a blank reads as data that failed to load.

The room figures SHALL sum to the month they sit under. Where they would not, the screen SHALL NOT present them as a breakdown of it.

A cash figure SHALL NOT appear in a room row. Every figure in the row is keyed on the month an invoice was issued; the cash figure is keyed on the day money arrived, and one row carrying both asserts they are measured the same way.

#### Scenario: Reading the rooms

- **WHEN** the owner reads a month that billed something
- **THEN** the rooms behind it are shown, each with its tenant and what it was billed, has paid and still owes

#### Scenario: A room with no recorded tenant

- **WHEN** a room's tenancy has nobody responsible recorded
- **THEN** the row says so rather than showing an empty name

#### Scenario: The rooms add up

- **WHEN** the owner compares a month's room rows against its total
- **THEN** the rows sum to that total

#### Scenario: No cash figure in a room row

- **WHEN** the owner reads any room row
- **THEN** it carries no money-arrived figure

### Requirement: A month says how many rooms its figures cover

The application SHALL state, for each month, how many rooms were let, how many were billed and owe nothing, how many owe something, and how many were billed nothing at all.

A sum with no count behind it cannot be checked. An owner who knows eight rooms are let and reads a figure covering six has learned something the figure alone does not say — and the count that matters most is the last one, because a room nobody invoiced is a mistake that no amount on this screen would otherwise reveal.

Rooms billed nothing SHALL be counted separately from rooms that owe nothing. They owe nothing either, so folding them together makes the arithmetic work while reporting a building where rooms were never invoiced as having collected from them.

Where a total is made of several records, the application SHALL say how many.

#### Scenario: Counts beside a month

- **WHEN** the owner reads a month
- **THEN** the number of rooms let, collected, outstanding and unbilled are shown with it

#### Scenario: A room nobody invoiced

- **WHEN** a room was let for a month and nothing was billed against it
- **THEN** it is counted as unbilled and is NOT presented as collected

#### Scenario: What a cost is made of

- **WHEN** the owner reads what was spent in a month
- **THEN** the number of records behind it is shown
