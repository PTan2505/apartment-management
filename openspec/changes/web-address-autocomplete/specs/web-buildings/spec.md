## MODIFIED Requirements

### Requirement: The owner can create and edit a building

The application SHALL let the owner create a building and edit an existing one, capturing its name, address, and both rates.

The street line, ward, city, and country SHALL each be presented as a field, and SHALL be editable by default. Address lookup is optional infrastructure and its data is incomplete — a deployment may have none configured, the provider may be unreachable, an address may not be in its data, and a resolved value may be wrong — so entering an address by hand SHALL always work. Requiring a chosen place in order to create a building would make an external service a prerequisite for a core operation.

Where lookup is available, the street address field SHALL itself act as the search: what is typed into it SHALL be looked up, and matching places SHALL be offered beneath it. There SHALL NOT be a separate search box, because an address typed to find a place and an address recorded on the building are the same thing, and two fields for it would ask for it twice.

Choosing a place SHALL fill all four fields from it and SHALL record which place they came from.

Looking up SHALL NOT happen on every keystroke, and what is typed SHALL be part of the building's address immediately, so a submission never omits text that had been entered but not yet looked up.

Once filled from a chosen place the four fields SHALL become read-only, because they then describe that place rather than whatever was typed. Choosing a different place SHALL replace them with the new one's values.

The owner SHALL be able to make the fields editable again. Doing so SHALL discard the recorded place, because the values may no longer be the ones it supplied.

Where lookup cannot work — none configured, or the provider unavailable — the form SHALL say so and the fields SHALL remain editable, rather than offering a search that cannot answer.

The form SHALL require exactly what the API requires and no more, so it never rejects input the API would have accepted. Rates SHALL accept fractional values and SHALL NOT accept negative ones. Country SHALL default so it need not be entered.

When the API rejects a submission, the reported problems SHALL be shown against the fields they concern where the API identifies them, and otherwise against the form.

A submission in progress SHALL be indicated, and the same submission SHALL NOT be sent twice.

On success the list SHALL reflect the change without the owner reloading the screen.

#### Scenario: Creating a building

- **WHEN** an owner submits a valid new building
- **THEN** it is created and appears in the list without a reload

#### Scenario: The address fields are editable by default

- **WHEN** an owner opens the form
- **THEN** the street line, ward, city, and country are shown as editable fields

#### Scenario: Choosing an address fills its parts

- **WHEN** an owner searches for an address and chooses a result
- **THEN** the street line, ward, city, and country are filled from that place

#### Scenario: Filled fields become read-only

- **WHEN** an owner has chosen an address
- **THEN** the four fields show its values and cannot be edited directly

#### Scenario: Choosing a different address replaces the values

- **WHEN** an owner chooses one address and then chooses another
- **THEN** the four fields are refilled from the second place

#### Scenario: Making the fields editable again

- **WHEN** an owner makes the filled fields editable again
- **THEN** they keep their values, become editable, and the building no longer records the place they came from

#### Scenario: A building created from a chosen address records its place

- **WHEN** an owner creates a building from an address chosen by searching
- **THEN** the building records which place the address came from

#### Scenario: Entering the address by hand

- **WHEN** an owner fills the address fields without choosing any place
- **THEN** the building is created and records no place

#### Scenario: A chosen place with no street

- **WHEN** an owner chooses a place that names only an administrative area, so no street is supplied
- **THEN** the street line is filled as empty, and the owner can make the fields editable to supply it

#### Scenario: Choosing a place after typing

- **WHEN** an owner types an address and then chooses one of the places offered
- **THEN** the chosen place's values replace what was typed, and that place is recorded

#### Scenario: A filled field shows its label clearly

- **WHEN** a field has been filled from a chosen place
- **THEN** its label is presented as it is for a field typed into by hand, without obscuring the value

#### Scenario: Lookup is not configured

- **WHEN** an owner opens the form on a deployment where address lookup is not configured
- **THEN** no search is offered, the form explains why, and the address fields remain editable

#### Scenario: The provider is unavailable

- **WHEN** address lookup fails because the provider cannot be reached
- **THEN** the form says so and manual entry remains available, so a building can still be created

#### Scenario: A search matching nothing

- **WHEN** an owner searches for an address that matches no place
- **THEN** the form says nothing was found, rather than reporting a failure, and the fields remain editable

#### Scenario: The candidate list closes once a place is chosen

- **WHEN** an owner chooses a place from the candidates
- **THEN** the remaining candidates are no longer listed

#### Scenario: Looking up does not issue a request per keystroke

- **WHEN** an owner types a multi-character address
- **THEN** matching places are requested once the typing settles rather than once per character

#### Scenario: There is one address field, not two

- **WHEN** an owner opens the form
- **THEN** the street address is asked for once, and typing into that field is what looks the address up

#### Scenario: Typed text is not lost by submitting quickly

- **WHEN** an owner types a street address and submits before any lookup has run
- **THEN** the building records exactly what was typed

#### Scenario: Editing a building

- **WHEN** an owner changes an existing building's details and submits
- **THEN** the changes are saved and the list reflects them without a reload

#### Scenario: Editing a building's address

- **WHEN** an owner edits an existing building
- **THEN** its address fields are shown editable, whether or not it was created from a chosen place

#### Scenario: Country need not be entered

- **WHEN** an owner creates a building without naming a country
- **THEN** the building is created with the default country

#### Scenario: A fractional rate is accepted

- **WHEN** an owner enters a rate with a fractional part
- **THEN** it is accepted and stored as entered

#### Scenario: A negative rate is rejected

- **WHEN** an owner enters a negative rate
- **THEN** the form reports it and the submission is not sent

#### Scenario: Required fields are reported

- **WHEN** an owner submits without a name, street address, ward, or city
- **THEN** the form reports which are required and the submission is not sent

#### Scenario: Field-level problems from the API are attributed

- **WHEN** the API rejects a submission and identifies which fields are at fault
- **THEN** those problems are shown against those fields

#### Scenario: Submission in progress

- **WHEN** a submission is in flight
- **THEN** the form indicates it and a second submission of the same form is prevented

#### Scenario: The form is usable on a phone

- **WHEN** an owner opens the form on a narrow viewport
- **THEN** it is usable at that width, with every field reachable and the form dismissible
