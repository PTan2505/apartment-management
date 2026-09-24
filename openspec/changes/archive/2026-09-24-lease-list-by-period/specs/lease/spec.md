## ADDED Requirements

### Requirement: Leases can be listed by when they began and when they ended

The system SHALL allow an authenticated `owner` to list leases bounded by a from-date, a to-date, or both. Each bound constrains its own end of the tenancy:

- **from** — the tenancy BEGAN on or after that day
- **to** — the tenancy ENDED on or before that day
- **both** — both hold, so only tenancies that ran entirely inside the period are listed

Containment, not overlap. Asked for both bounds, an owner is asking which tenancies began and finished within the window — a tenancy that started years earlier and is still running is not one of them, and returning it would answer a different question.

The END used for the to-bound SHALL be the recorded move-out where there is one, and the agreed end otherwise. A tenancy that ended early ended the day it ended; a running tenancy is judged on the term it agreed, which is the only end it has.

A CANCELLED tenancy SHALL NOT match either bound. It covered no days, and its recorded dates describe an agreement rather than an occupancy — matching on them would place a tenancy inside a period the status exists to say it never occupied.

The bounds SHALL combine with the other filters, and SHALL NOT change what the listing returns when neither is given.

#### Scenario: From-date alone

- **WHEN** an owner names only a from-date
- **THEN** only tenancies that began on or after that day are listed, whenever they end

#### Scenario: To-date alone

- **WHEN** an owner names only a to-date
- **THEN** only tenancies that ended on or before that day are listed, whenever they began

#### Scenario: Both bounds

- **WHEN** an owner names a period of two months
- **THEN** only tenancies that both began and ended inside it are listed

#### Scenario: A tenancy spanning the whole period

- **WHEN** a tenancy began before the from-date and ends after the to-date
- **THEN** it is not listed, because it is not contained by the period

#### Scenario: A tenancy that began inside but has not ended

- **WHEN** a tenancy began inside the period and its agreed end falls after the to-date
- **THEN** it is not listed

#### Scenario: A tenancy that ended early

- **WHEN** a tenancy agreed to run until December recorded a move-out in June
- **THEN** it is judged on June: it matches a to-date in July and not one in May

#### Scenario: A cancelled tenancy matches nothing

- **WHEN** a cancelled tenancy's agreed dates fall inside the named period
- **THEN** it is not listed

#### Scenario: Neither bound given

- **WHEN** an owner lists leases without naming a period
- **THEN** the listing behaves exactly as it did before
