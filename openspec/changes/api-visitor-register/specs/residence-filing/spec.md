## Purpose

The paperwork a landlord owes the authorities when somebody stays in their building,
produced from what the system already knows instead of copied out by hand.

The official form (CT01, *Tờ khai thay đổi thông tin cư trú*) asks for about fifteen
things. Thirteen of them are facts the system holds the moment a visitor is registered:
who they are, where they normally live, whose room they are staying in, and at what
address. Typing those again, per visit, by hand, is how a legal obligation turns into a
stack of forms nobody files.

## ADDED Requirements

### Requirement: A blank residence form is kept on file

The system SHALL hold one blank residence form, uploaded by the `owner`, replaceable, and
downloadable so the owner can see exactly what is being filled in.

It SHALL be kept the way the blank contract already is: a single object in storage with no
database row, replaced rather than versioned, because a second place recording "which
form is current" is a second place for it to be wrong.

The form SHALL be a template rather than a picture of one — it carries named placeholders
where the answers go. The official form is reissued when the regulation changes, and an
owner who can replace the file themselves is not waiting on a deployment.

A system with no form on file SHALL say so, and SHALL refuse to produce a filing rather
than inventing a layout of its own. A form this owner has never seen is not one they
should be handed to sign.

#### Scenario: Uploading the blank form

- **WHEN** the owner uploads a blank residence form
- **THEN** it is kept, and reported as on file with its name, size and the time it arrived

#### Scenario: Replacing it

- **WHEN** the owner uploads a second blank form
- **THEN** it replaces the first, and exactly one blank form remains in storage

#### Scenario: Nothing on file

- **WHEN** no blank form has been uploaded and a filing is asked for
- **THEN** the system responds with HTTP 404, naming the missing form, and produces no document

#### Scenario: Only the owner replaces it

- **WHEN** a `manager` uploads or deletes the blank form
- **THEN** the system responds with HTTP 403

#### Scenario: A manager may read it

- **WHEN** a `manager` downloads the blank form
- **THEN** it is served, because a manager files this paperwork too

### Requirement: The form is filled from a tenancy and the visitors chosen on it

The system SHALL produce a filled residence form for one tenancy and one or more of the
visitors registered against it.

The first chosen visitor SHALL be the declarant, and the rest SHALL be entered as the
household members changing with them — that is the form's own structure, and a family
arriving together is one filing rather than three.

The head of household SHALL be the tenancy's lease signatory. The signatory is who is
registered as living at that address; the landlord is not, and naming the landlord there
would be a false statement on a government form.

The address of the stay SHALL be the building's address with the room, and SHALL serve as
both the place of temporary residence and the current place of residence, because for this
filing they are the same place.

The document SHALL be produced on demand and SHALL NOT be stored. It is derived entirely
from records that can change; a kept copy would start disagreeing with them the first time
a date was corrected.

#### Scenario: One visitor

- **WHEN** a filing is produced for a tenancy and one registered visitor
- **THEN** the document carries that visitor as the declarant, the lease signatory as head of household, and the building address with the room as the place of stay

#### Scenario: A family arriving together

- **WHEN** a filing is produced for three visitors on one tenancy
- **THEN** the first is the declarant and the other two appear as household members changing with them, in one document

#### Scenario: A visitor on another tenancy

- **WHEN** a filing names a visitor registered against a different tenancy
- **THEN** the system responds with HTTP 400 and produces no document

#### Scenario: A cancelled registration

- **WHEN** a filing names a cancelled registration
- **THEN** the system responds with HTTP 400, because a stay that is not happening is not one to file for

#### Scenario: No visitor chosen

- **WHEN** a filing is asked for with no visitor named
- **THEN** the system responds with HTTP 400

#### Scenario: It is not kept

- **WHEN** the same filing is produced twice
- **THEN** each is generated afresh from current records, and no copy is stored

### Requirement: What cannot be filled is reported, never guessed

Where the system does not hold a value the form asks for, the box SHALL be left empty and
the filing SHALL report which boxes those were.

The system SHALL NOT substitute a default, a placeholder, or an inference. This is a
document somebody signs and submits to the police; a plausible-looking guess is worse than
a blank, because a blank gets noticed and filled in while a guess gets signed.

The signatory's identity number in particular SHALL be reported as missing when the system
does not hold it, rather than omitted silently — it is a required box on the form, and the
owner needs to know before they print.

#### Scenario: The signatory's identity number is not on file

- **WHEN** a filing is produced for a tenancy whose signatory has no identity number recorded
- **THEN** the document leaves that box empty and the response names it as a box to complete by hand

#### Scenario: A visitor with no occupation recorded

- **WHEN** a filing is produced for a visitor with no occupation recorded
- **THEN** that box is empty and is named as one to complete by hand

#### Scenario: Nothing is invented

- **WHEN** any box has no corresponding record
- **THEN** it is empty in the document, and no default or placeholder text appears in it

#### Scenario: Everything is on file

- **WHEN** every value the form asks for is recorded
- **THEN** the filing reports no boxes to complete by hand

### Requirement: Who may produce a filing

The `owner` SHALL produce a filing for any tenancy. A `manager` SHALL produce one for a
tenancy in a building they cover. A `maintenance` account SHALL produce none.

A portal token SHALL produce none. The filing carries the signatory's identity number and
the other visitors' personal details, which is more than the tenant who registered one
guest was given reach over.

#### Scenario: The owner

- **WHEN** the owner produces a filing for any tenancy
- **THEN** the document is served

#### Scenario: A manager in their buildings

- **WHEN** a manager produces a filing for a tenancy in a building they cover
- **THEN** the document is served

#### Scenario: A manager outside their buildings

- **WHEN** a manager produces a filing for a tenancy in a building they do not cover
- **THEN** the system responds with HTTP 404

#### Scenario: Maintenance

- **WHEN** a maintenance account produces a filing
- **THEN** the system responds with HTTP 403

#### Scenario: A tenant

- **WHEN** a portal token is used to produce a filing
- **THEN** the system responds with HTTP 404, as it does for every staff-only facility
