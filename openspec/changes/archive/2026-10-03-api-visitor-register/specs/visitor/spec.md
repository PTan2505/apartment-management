## Purpose

People staying in a room who are not on the tenancy — a visiting relative, a friend for a
fortnight. Recorded so the owner knows who is in their building and can file the
temporary-residence paperwork that is legally theirs to file, and so a "visit" that has
quietly become residence is visible rather than invisible.

## ADDED Requirements

### Requirement: A visitor is registered against a tenancy

A visitor registration SHALL record, against one tenancy: a full name, an
identity-document number, a date of birth, a sex, a place of permanent residence, the
relationship to the lease signatory, the date the stay begins, the date it is expected to
end, and optionally a telephone number, an email address, an occupation and a note.

Those first six are not a wish-list. They are the fields the official residence form
requires, and a registration missing one produces a form that cannot be filed. The data
is collected at the one moment somebody is looking at the identity document, rather than
reconstructed weeks later when the form is wanted.

A telephone number, an email address and an occupation SHALL be optional, because the
form itself is routinely filed without them: a visiting grandmother has no workplace and
a child has no telephone, and a required field there would be filled with a lie.

It SHALL be its own record, NOT a customer. A customer is somebody who rents; the list of
customers is what a lease signatory is chosen from, and filling it with people who stayed
two nights makes that choice harder for no gain.

The expected end date SHALL be required. Without it there is no stay to measure, nothing
to flag, and nothing to file — "until further notice" is the state this feature exists to
make visible.

A registration SHALL be editable while the stay is in the future or current, and SHALL be
cancellable. A past stay SHALL remain as a record.

A registration SHALL NOT change the tenancy's occupant count, its water charge, or any
per-person service fee. It is a record of who is present, not a billing term. The two are
deliberately separate, as the occupant list and the occupant count already are.

#### Scenario: Registering

- **WHEN** a visitor is registered with a name, document number, date of birth, sex, permanent residence, relationship to the signatory and dates
- **THEN** the tenancy carries the registration

#### Scenario: A field the form requires is missing

- **WHEN** a registration is submitted without a date of birth, a sex, a place of permanent residence or a relationship to the signatory
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: A field the form tolerates is missing

- **WHEN** a registration is submitted with no telephone number, no email address and no occupation
- **THEN** it is recorded, and the residence form reports those boxes as ones to complete by hand

#### Scenario: No end date

- **WHEN** a registration is submitted without an expected end date
- **THEN** the system responds with HTTP 400 and records nothing

#### Scenario: It does not reach billing

- **WHEN** a visitor is registered on a tenancy
- **THEN** the tenancy's occupant count is unchanged, and the next invoice charges water for the same number of people as before

#### Scenario: Not a customer

- **WHEN** a visitor is registered
- **THEN** no customer record is created, and the customer list is unchanged

#### Scenario: Cancelling

- **WHEN** a registration is cancelled before the stay ends
- **THEN** it no longer counts as a current stay

### Requirement: A registration carries photographs of the identity document

A registration SHALL be able to hold a photograph of each side of the identity document,
uploaded the way every other image in this system is: the API signs a short-lived URL,
the browser sends the bytes to storage, and the API records the object only once it
confirms it arrived.

Image bytes SHALL NOT pass through the API. Accepted types and a size ceiling SHALL be
enforced where the URL is signed.

They SHALL be read back through short-lived links, and SHALL be reachable only by the
owner, the building's manager, and the portal holder for that tenancy.

#### Scenario: Uploading a side

- **WHEN** an upload URL is asked for, the bytes sent, and the key confirmed
- **THEN** the registration carries that side, returned with a link that expires

#### Scenario: Not an image

- **WHEN** an upload URL is asked for with a type that is not an accepted image type
- **THEN** the system responds with HTTP 400 and signs nothing

#### Scenario: Somebody else's tenancy

- **WHEN** a portal token for one tenancy asks for a registration belonging to another
- **THEN** the system responds with HTTP 404

#### Scenario: Maintenance

- **WHEN** a maintenance account reads a registration
- **THEN** the system responds with HTTP 403

### Requirement: A stay past two weeks is reported as overlong

A registration whose stay has run more than fourteen days SHALL be reported as overlong,
and the tenancies holding one SHALL be findable.

Fourteen days is where a visit stops being a visit. Past it, the person is being housed:
the water they use is charged on an occupant count that does not include them, and any
per-person fee is short by one.

The system SHALL NOT act on this. It SHALL NOT change the occupant count, raise a charge,
or end the registration. Those are the owner's decisions about a person they may know
things about that the system does not.

The measurement SHALL be from the stay's start to today for a stay still running, and
SHALL stop at the recorded end for one that has finished — a visit that ran three weeks
last year is still worth seeing, but it is not an open question.

#### Scenario: Still here after a fortnight

- **WHEN** a registration began fifteen days ago and has not ended
- **THEN** it is reported as overlong

#### Scenario: Within a fortnight

- **WHEN** a registration began three days ago
- **THEN** it is not reported as overlong

#### Scenario: Nothing happens automatically

- **WHEN** a registration becomes overlong
- **THEN** the tenancy's occupant count is unchanged, no charge is raised, and the registration stays open

#### Scenario: A long stay that has finished

- **WHEN** a registration ran for three weeks and ended last month
- **THEN** it is still shown as having been overlong, and is not counted as an open question

### Requirement: Who may register and who may read

The portal holder for a tenancy SHALL be able to register a visitor, read the
registrations of THAT tenancy, and cancel one.

The `owner` SHALL read and write registrations anywhere. A `manager` SHALL read and write
them within the buildings they cover. A `maintenance` account SHALL reach none.

A portal token SHALL reach only its own tenancy's registrations, as it already does for
that tenancy's bills and reports.

#### Scenario: A tenant registers from their link

- **WHEN** a portal token is used to register a visitor
- **THEN** the registration is created against that token's tenancy

#### Scenario: The owner adds one

- **WHEN** the owner registers a visitor on any tenancy
- **THEN** it is created, recorded as having been added by staff rather than by the tenant

#### Scenario: A manager outside their buildings

- **WHEN** a manager reads registrations for a tenancy in a building they do not cover
- **THEN** the system responds with HTTP 404
