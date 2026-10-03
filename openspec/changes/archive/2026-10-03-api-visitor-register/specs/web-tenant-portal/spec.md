## ADDED Requirements

### Requirement: The portal has a page for registering a visitor

The portal SHALL let the tenant register somebody staying with them: a name, an identity
number, a date of birth, a sex, where that person normally lives, how they are related to
the person who signed the tenancy, photographs of both sides of the document, a start date
and an expected end date. A telephone number, an email address and an occupation SHALL be
offered and SHALL be optional.

That is more than a guest book asks, and the page SHALL say why in one line: these are the
boxes on the form the landlord has to file, and filling them here means nobody is rung up
for them later. A form that asks a tenant for their cousin's date of birth without saying
what it is for reads as nosiness.

The optional fields SHALL be visibly optional and SHALL NOT stand between the tenant and
submitting. The fields the form requires SHALL be refused when empty, naming each one,
because a registration missing one produces paperwork that cannot be filed — which is
discovered by the owner, weeks later, at the police station.

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

- **WHEN** a tenant fills in the name, number, date of birth, sex, permanent residence, relationship to the signatory and dates, and submits
- **THEN** it is recorded and appears in their list immediately

#### Scenario: Why so many boxes

- **WHEN** the tenant opens the page
- **THEN** it says in one line that these are the boxes on the form the landlord has to file

#### Scenario: A required box left empty

- **WHEN** the tenant leaves the date of birth or the permanent residence empty
- **THEN** the form refuses before sending anything and names the box

#### Scenario: Skipping the optional boxes

- **WHEN** the tenant submits with no telephone number, email address or occupation
- **THEN** it is recorded, and those boxes were visibly marked optional

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
