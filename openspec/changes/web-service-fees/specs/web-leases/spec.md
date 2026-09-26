## ADDED Requirements

### Requirement: A tenancy's monthly service fees are managed on its page

A tenancy's page SHALL show the service fees it is billed for every month, each with its
monthly amount and the date it started applying, and SHALL state what they add to each
month's invoice in total.

It SHALL let the fees be attached from the building's catalogue with a quantity and an
optional start date, let the quantity be changed, and let a fee be stopped. Stopping one
SHALL be described as taking effect from that day forward, leaving months already billed
alone.

Only fees the building still offers SHALL be attachable, because the API refuses a
retired one.

A fee whose catalogue entry has since been retired SHALL say so while still being listed
as charged: the tenancy holds its own copy of the price and keeps being billed.

A tenancy that has ended or been cancelled SHALL show its fees and offer no changes.

These controls are available to a manager as well as the owner. Attaching a fee takes
the price from the catalogue, so it sets no price.

#### Scenario: Attaching a fee

- **WHEN** a fee from the building's catalogue is attached with a quantity
- **THEN** the tenancy lists it, shows the monthly amount as price times quantity, and states the new monthly total

#### Scenario: What it will cost, before committing

- **WHEN** a fee and a quantity have been chosen but not yet attached
- **THEN** the form states what that will add each month

#### Scenario: Changing how many

- **WHEN** the quantity of an attached fee is changed
- **THEN** the monthly amount and the tenancy's total follow it

#### Scenario: Stopping a fee

- **WHEN** an attached fee is stopped
- **THEN** it moves to the stopped group showing the period it applied for, and no longer counts toward the monthly total

#### Scenario: The building retired it

- **WHEN** a tenancy holds a fee the building has since retired
- **THEN** the tenancy still lists it as charged, and says the building no longer offers it

#### Scenario: A finished tenancy

- **WHEN** a tenancy has ended
- **THEN** its fees are listed and nothing offers to add, change or stop one

#### Scenario: A building with nothing to offer

- **WHEN** a fee is attached in a building whose catalogue is empty
- **THEN** the form says so and points at the building's page
