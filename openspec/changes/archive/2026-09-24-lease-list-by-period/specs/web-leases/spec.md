## ADDED Requirements

### Requirement: The tenancy list separates the facts it joins together

The list SHALL show the date a tenancy began and the date it ends as SEPARATE columns, and the room and its building as SEPARATE columns.

Both pairs were single cells holding two facts joined by a separator. The dates were "01/03/2026 – 28/02/2027"; the room was "Q54299A · Trọ thủ đức". A reader scanning for the tenancies ending this quarter had to read every cell and split it by eye, and neither date could be compared against the rows above it.

The ending column SHALL show the day the tenancy actually covers to — the recorded move-out where there is one, the agreed end otherwise — and SHALL make clear which of the two it is showing, because "ended in June" and "agreed to end in June" are different facts about a tenancy.

A CANCELLED tenancy SHALL NOT show a range in either column. It covered no days, and printing its agreed dates under headings about occupancy would state as fact the one thing that status denies; it SHALL say it was cancelled instead.

#### Scenario: Reading the list

- **WHEN** the owner opens the tenancy list
- **THEN** each row shows the date it began and the date it ends in separate columns, and the room and its building in separate columns

#### Scenario: Rooms sharing a code

- **WHEN** two buildings each hold a room with the same code
- **THEN** the two are still told apart, because the building is its own column rather than a suffix

#### Scenario: A tenancy that ended early

- **WHEN** a tenancy recorded a move-out before its agreed end
- **THEN** the ending column shows the day it actually ended, marked as what happened rather than what was agreed

#### Scenario: A cancelled tenancy

- **WHEN** a cancelled tenancy is listed
- **THEN** neither column presents it as having covered days

### Requirement: The owner can narrow tenancies by when they began and ended

The application SHALL let the owner name a from-date, a to-date, or both, and SHALL list the tenancies those bounds allow: begun on or after the from-date, ended on or before the to-date, and — where both are given — contained entirely within the period.

Either bound alone is a question worth asking. "Everything signed since March" and "everything that has finished by December" are both things an owner looks for, and neither requires the other.

The screen SHALL say what each bound does, because a date field labelled only "từ" could as easily mean "still running from" — and the two answers differ by every long tenancy in the list.

The filter SHALL be requested from the API, and SHALL survive a page change and a reload like the filters already there.

#### Scenario: From-date alone

- **WHEN** the owner names only a from-date
- **THEN** the tenancies listed are those that began on or after it

#### Scenario: To-date alone

- **WHEN** the owner names only a to-date
- **THEN** the tenancies listed are those that ended on or before it

#### Scenario: Both bounds

- **WHEN** the owner names both
- **THEN** only tenancies that ran entirely inside the period are listed

#### Scenario: What the bounds mean is on the screen

- **WHEN** the owner looks at the period filter
- **THEN** it says that the dates bound the start and the end, not merely a period the tenancy touched

#### Scenario: Clearing it

- **WHEN** the owner clears the period
- **THEN** the list returns to what it showed before, with the other filters untouched
