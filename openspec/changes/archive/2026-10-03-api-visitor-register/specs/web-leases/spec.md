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

### Requirement: A tenancy can produce the residence filing

The tenancy page SHALL let the `owner`, and a `manager` covering the building, produce the
filled residence form for registrations chosen on that tenancy.

Several registrations SHALL be selectable for one filing, because a family that arrived
together is one form rather than three, and the person filing it should not have to know
that to get it right.

The screen SHALL name the boxes the system could not fill BEFORE the document is produced,
not after. An owner who discovers at the printer that the signatory's identity number is
missing has wasted the trip; one who is told on screen can enter it first.

Where the missing box is one the system can hold — the signatory's identity number — the
screen SHALL offer the way to record it rather than only reporting it absent.

A tenancy whose signatory or building is missing something the form requires SHALL still be
able to produce the document, with those boxes empty. A form that is nine-tenths filled is
worth more than a refusal, because the remaining tenth can be written in by hand.

#### Scenario: Producing a filing

- **WHEN** the owner selects one registration and produces the filing
- **THEN** a filled residence form is downloaded

#### Scenario: A family in one form

- **WHEN** the owner selects three registrations and produces the filing
- **THEN** one document is downloaded carrying all three

#### Scenario: Told before printing

- **WHEN** the signatory has no identity number recorded
- **THEN** the screen says so before the document is produced, and offers to record it

#### Scenario: Produced anyway

- **WHEN** the owner produces the filing with a box the system cannot fill
- **THEN** the document is still downloaded, with that box empty

#### Scenario: No blank form uploaded

- **WHEN** no blank residence form is on file
- **THEN** the screen says the blank form must be uploaded first, and offers no download

#### Scenario: A manager outside their buildings

- **WHEN** a manager could reach a tenancy in a building they do not cover
- **THEN** no filing can be produced from it
