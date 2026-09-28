## ADDED Requirements

### Requirement: A tenant can report something broken from their link

The portal SHALL let the holder of a valid link report a fault, describing it in
their own words and attaching photographs if they have them.

The form SHALL ask for nothing the link already answers — not the room, not the
building, not who they are. A tenant filling in their own address on a page
reached by their own link is a page that does not know who it is talking to.

It SHALL refuse to send an empty description, saying so before the request
rather than after it.

Photographs SHALL be optional. Somebody reporting a leak from a phone in a dark
stairwell is the case this exists for, and a required attachment is a reason not
to report at all.

#### Scenario: Reporting a fault

- **WHEN** a tenant describes something broken and sends it
- **THEN** the report is recorded against their tenancy and appears on the portal

#### Scenario: With photographs

- **WHEN** they attach photographs
- **THEN** those are uploaded and shown with the report

#### Scenario: Nothing written

- **WHEN** they try to send with nothing described
- **THEN** the form says so and nothing is sent

### Requirement: The portal says what became of a report

The portal SHALL show each report the tenancy has raised, with what was said,
when, its state in the tenant's terms, and the appointment once one has been
agreed.

A report waiting to be looked at SHALL say that plainly rather than showing an
absence, and one that is done SHALL say when.

The portal SHALL NOT name the member of staff who scheduled or closed it. A
tenant needs to know somebody is coming and when.

#### Scenario: Waiting

- **WHEN** a tenant opens the portal after reporting something nobody has scheduled yet
- **THEN** it says the report has been received and nobody has been arranged yet

#### Scenario: An appointment agreed

- **WHEN** staff have recorded an appointment
- **THEN** the portal shows that date and time

#### Scenario: Done

- **WHEN** staff have closed the report
- **THEN** the portal says it is done, and when

#### Scenario: Nothing reported

- **WHEN** a tenancy has raised no reports
- **THEN** the portal says so, and offers the way to report something
