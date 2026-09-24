## ADDED Requirements

### Requirement: The tenancy screen says how near its end a tenancy is, and how far past it

The tenancy screen SHALL state the time remaining on a running tenancy, and SHALL
state how long a tenancy has been past its agreed term once that term has ended.

Both SHALL be counted from the last day the tenancy covers, not from the
exclusive boundary the API stores — a tenancy covered through the 30th has a day
left on the 30th, and is one day past its term on the 1st.

The figure SHALL be emphasised when the tenancy is within two weeks of its end
and when it is past it, using the colours those states already carry in the
list. A tenancy with months left SHALL keep the plain reading it has now: an
emphasis that applies to everything marks nothing.

#### Scenario: Days rather than silence once the term has run out

- **WHEN** the owner opens a tenancy whose agreed term ended five days ago
- **THEN** the screen says it is five days past its term, rather than omitting the figure

#### Scenario: A tenancy about to end says so plainly

- **WHEN** the owner opens a tenancy ending in five days
- **THEN** the remaining time is shown and marked as needing attention

#### Scenario: A tenancy with months left reads normally

- **WHEN** the owner opens a tenancy with three months left
- **THEN** the remaining time is shown without emphasis

#### Scenario: A finished tenancy claims nothing

- **WHEN** the owner opens a tenancy that has been handed back or cancelled
- **THEN** no remaining or overdue figure is shown, because neither is true of it
