## ADDED Requirements

### Requirement: A change to a tenancy's rates is confirmed before it is saved

The application SHALL ask the owner to confirm saving a tenancy whose electricity or water rate has changed, showing each changed rate as its previous value and its new one.

The confirmation SHALL say that invoices already issued keep the rates recorded on them, and that the new rate applies to billing from now on. A tenancy is billed at its own copies of the rates, so changing them here is the one place an owner can move what a running tenancy is charged — and the reach of that change is the thing they cannot see from the form.

Saving a tenancy whose rates are unchanged SHALL NOT be confirmed, however many other terms were edited.

#### Scenario: Saving a changed rate

- **WHEN** an owner changes a tenancy's electricity or water rate and saves
- **THEN** a confirmation lists each changed rate as old and new, and nothing is sent until it is confirmed

#### Scenario: Saving other terms

- **WHEN** an owner changes a tenancy's notice period, payment day or handover details but neither rate
- **THEN** the change is saved without a confirmation step

#### Scenario: The confirmation says what is not affected

- **WHEN** an owner is asked to confirm a changed rate
- **THEN** the confirmation says invoices already issued keep the rates recorded on them

#### Scenario: Declining keeps the form

- **WHEN** an owner declines the confirmation
- **THEN** the form is still open with the rates they entered, and nothing was sent
