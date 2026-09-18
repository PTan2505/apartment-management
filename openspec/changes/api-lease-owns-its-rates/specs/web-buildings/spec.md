## ADDED Requirements

### Requirement: The rate fields say who a new figure will reach
The building form SHALL state, beside its electricity and water rate fields, that a changed rate applies to tenancies signed from then on and to invoices issued for them, and not to tenancies already signed.

The statement SHALL be shown when editing an existing building, where the question arises, and SHALL NOT be shown when creating one, where there is nothing already signed to reassure anyone about.

#### Scenario: Editing a building
- **WHEN** the owner opens an existing building for editing
- **THEN** the form states that changed rates apply only to tenancies signed from then on

#### Scenario: Creating a building
- **WHEN** the owner creates a new building
- **THEN** that statement is absent
