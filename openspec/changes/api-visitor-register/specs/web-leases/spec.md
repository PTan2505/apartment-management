## ADDED Requirements

### Requirement: A tenancy shows who is registered as staying

A tenancy's page SHALL show the visitors registered against it — name, dates, and whether
the stay is upcoming, current or finished — and SHALL let the `owner` and the building's
`manager` add and cancel one.

It SHALL be kept visually apart from the occupant list. The two answer different
questions and only one of them is billed, and a reader who merges them will go looking
for a water charge that is not there.

A stay that has run past two weeks SHALL be marked, and the mark SHALL say what the
consequence is: this person is being housed, and the tenancy's occupant count does not
include them. It SHALL offer the way to act — correcting the occupant count — without
doing it.

The identity photographs SHALL be reachable from here by roles that may see them.

A tenancy with nobody registered SHALL say so plainly rather than showing an empty area.

#### Scenario: Reading the registrations

- **WHEN** the owner opens a tenancy with two registrations
- **THEN** both are listed with their dates and state, apart from the occupant list

#### Scenario: Somebody is overdue

- **WHEN** a registration has run more than fourteen days
- **THEN** it is marked, the page says the occupant count does not include them, and it offers to correct the count

#### Scenario: Nothing is done automatically

- **WHEN** the owner ignores the mark
- **THEN** nothing changes: no count moves and no charge appears

#### Scenario: Staff add one

- **WHEN** the owner registers a visitor from this page
- **THEN** it is recorded, and shown as added by staff rather than by the tenant

#### Scenario: Nobody registered

- **WHEN** the tenancy has no registrations
- **THEN** the page says so

#### Scenario: Maintenance

- **WHEN** a maintenance account could reach this page
- **THEN** it shows no registrations at all
