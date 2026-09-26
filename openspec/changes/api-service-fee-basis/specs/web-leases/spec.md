## ADDED Requirements

### Requirement: A per-person fee is shown against the head count, not a quantity

Where a tenancy holds a fee charged per person, its page SHALL show the head count it is
billed against and SHALL NOT offer a quantity to change — the tenancy's occupant count
decides it, and a second number would imply otherwise.

The monthly amount SHALL be shown as the agreed unit amount times that head count, and
SHALL follow the occupant count when it changes.

Attaching a per-person fee SHALL NOT ask for a quantity, and SHALL state what it will
add at the tenancy's current head count.

#### Scenario: Reading a per-person fee

- **WHEN** a tenancy recording two occupants holds a per-person fee
- **THEN** it shows the amount times two, says it is charged per person, and offers no quantity box

#### Scenario: The head count changes

- **WHEN** the tenancy's occupant count is corrected to three
- **THEN** the fee's monthly amount and the tenancy's monthly total follow it

#### Scenario: Attaching one

- **WHEN** a per-person fee is attached to a tenancy
- **THEN** the form asks no quantity and states what it adds at the current head count

#### Scenario: A fee that came with the tenancy

- **WHEN** a tenancy picked up a fee because its building applies it by default
- **THEN** it is listed like any other, and can be stopped

### Requirement: Attaching a fee makes its start date a decision, not a default

The form that attaches a service fee to a tenancy SHALL require the person to say when
it starts applying, offering the two answers that are actually meant:

- from the tenancy's start date — a fee agreed at signing and recorded late;
- from a date they give — a fee newly agreed with the tenant partway through.

It SHALL NOT silently default to either. The API's own default is the tenancy's start
date, which is right for the first case and quietly wrong for the second: a fee agreed
in March and attached with no date is dated to the tenancy's beginning, and any month
not yet billed — including months before the tenant ever agreed to it — is then charged
in full.

Where the chosen date falls before a month that has already been invoiced, the form
SHALL say that invoices already issued do not change, so the person is not left
expecting a correction that will not arrive.

#### Scenario: A fee agreed partway through

- **WHEN** a fee is attached from a date the owner gives
- **THEN** it applies from that date, and the month it falls in is charged for those days only

#### Scenario: A fee agreed at signing, recorded late

- **WHEN** a fee is attached from the tenancy's start date
- **THEN** it applies from the beginning of the tenancy

#### Scenario: Neither answer chosen

- **WHEN** the form is submitted without saying when the fee starts
- **THEN** it is refused before any request is sent, naming the field
