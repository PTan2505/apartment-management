## ADDED Requirements

### Requirement: The portal has a page for registering a visitor

The portal SHALL let the tenant register somebody staying with them: a name, an identity
number, photographs of both sides of the document, a start date and an expected end date.

It SHALL say why it is being asked, in the tenant's terms — the landlord has to register
guests who stay, and this is how it is filed — because a form demanding an ID photograph
with no explanation reads as intrusion and will be ignored.

The expected end date SHALL be required, and the form SHALL say that a stay can be
extended later rather than left open. "I don't know yet" is the answer the form has to
turn into a date.

The tenant SHALL see what they have registered, including stays that have ended.

Photographs SHALL upload with visible progress and report a failure against the side that
failed. The form SHALL be submittable without them, so a tenant without the card to hand
can file the rest and add them later, rather than abandoning the registration.

Nothing on this page SHALL mention the occupant count or any charge, because nothing here
changes one.

#### Scenario: Registering

- **WHEN** a tenant fills in the name, number and dates and submits
- **THEN** it is recorded and appears in their list immediately

#### Scenario: Why it is asked

- **WHEN** the tenant opens the page
- **THEN** it says the landlord has to register guests who stay, in plain terms

#### Scenario: No end date

- **WHEN** the tenant leaves the expected end date blank
- **THEN** the form refuses before sending anything, and says the stay can be extended later

#### Scenario: Filing without the card

- **WHEN** the tenant submits without photographs
- **THEN** it is recorded, and the registration offers to add them afterwards

#### Scenario: One side fails to upload

- **WHEN** two sides are chosen and one fails
- **THEN** the one that worked is kept and the page names the one that did not

#### Scenario: Their own history

- **WHEN** the tenant opens the page after a stay has ended
- **THEN** that registration is still listed, marked as finished

#### Scenario: On a phone

- **WHEN** the page is used at 390px
- **THEN** it fits the width and does not scroll sideways
