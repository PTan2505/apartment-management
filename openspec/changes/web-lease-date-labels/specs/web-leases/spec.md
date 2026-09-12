## MODIFIED Requirements

### Requirement: The dates shown are the days the tenancy covers

A date that ends a tenancy is exclusive: it is the first day no longer covered. The application SHALL present tenancy dates so that a reader takes away the days actually covered, and SHALL NOT present an exclusive end date as though the tenancy runs through it.

This is not presentation for its own sake. An owner reading "ends 01/07/2026" beside a tenant who must be out on 30 June will act on the wrong day — arranging a cleaner, showing the room, or billing a month that was never covered.

Every tenancy date SHALL be labelled by what it is to the owner — the first day lived there, the last day the agreement covers, the day the room was handed back — and not by a word that leaves the reader to work out which boundary is meant.

Where a tenancy has ended, the application SHALL show the day the room was handed back and the last day it covered, together. The handed-back day is the date owner and tenant actually agree on; the last day covered is the one billing and the next tenancy depend on. Showing only one leaves the reader to compute the other, and showing them in different places on one screen reads as two dates that disagree by a day.

The application SHALL distinguish a tenancy handed back before its agreed term ended, on the day it ended, and after it ended. An early departure SHALL NOT be described in words that also describe an on-time one.

#### Scenario: An end date is shown as the day covered through

- **WHEN** a lease begins 2026-01-01 for six months, so its expected end date is 2026-07-01
- **THEN** the screen conveys that the tenancy covers through 2026-06-30

#### Scenario: A recorded departure is shown as the day covered through

- **WHEN** a lease has a move-out recorded as 2026-07-05
- **THEN** the screen conveys that the room was handed back on 2026-07-05 and that the tenancy covered through 2026-07-04, together

#### Scenario: A tenancy that ran past its agreed term

- **WHEN** a lease's move-out was recorded after its expected end date
- **THEN** both are legible: what was agreed, and what happened, and it reads as having stayed past the agreement

#### Scenario: A tenancy handed back early

- **WHEN** a lease's move-out was recorded before its expected end date
- **THEN** it reads as handed back before the agreement ended, not as within the term

#### Scenario: A tenancy handed back on the day its agreement ended

- **WHEN** a lease's move-out date equals its expected end date
- **THEN** it reads as handed back on time

#### Scenario: Every date says what it is

- **WHEN** the owner reads the dates on a tenancy
- **THEN** each label names what the date is — the first day lived there, the last day the agreement covers, or the day the room was handed back

## ADDED Requirements

### Requirement: An occupant's departure reads the same way as the tenancy's

The application SHALL show an occupant's departure as the day they left — the first day they no longer lived there — named so that it reads in the same convention as the day a tenancy's room was handed back.

When a tenancy ends, every remaining occupant is recorded as leaving on the handed-back day. The two dates are the same day, and the screen SHALL make them read as the same day rather than as a last-day-covered beside a first-day-gone.

Where the owner records a departure, the application SHALL say which day it is asking for, and every sentence in that dialog SHALL be Vietnamese.

#### Scenario: Occupants who left when the room was handed back

- **WHEN** the owner views an ended tenancy whose occupants left at move-out
- **THEN** each occupant's departure day and the tenancy's handed-back day are the same date under matching wording

#### Scenario: Recording a departure

- **WHEN** the owner opens the dialog to record that somebody left
- **THEN** it explains that the date is the first day that person no longer lives there, and no sentence in it is in English
