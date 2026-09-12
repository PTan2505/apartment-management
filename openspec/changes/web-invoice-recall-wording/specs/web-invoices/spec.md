## ADDED Requirements

### Requirement: A withdrawn invoice has one name wherever it appears

The application SHALL name a withdrawn invoice with the same word on every screen that shows it — the invoice list, the invoice screen, a tenancy's invoice panel, the dialog that withdraws it, and every message that refers to it.

An owner follows a bill from one screen to the next. Two names for one state read as two states, and the owner is left to work out whether a bill marked one way on the tenancy is the same bill marked another way on the invoice it opens.

That name SHALL NOT be one the same screens use for a different state. A cancelled tenancy is shown beside its invoices, and a bill named like a cancelled tenancy suggests the two are connected.

Every sentence that names the state SHALL be Vietnamese.

#### Scenario: Following a withdrawn bill from a tenancy

- **WHEN** the owner sees a withdrawn bill in a tenancy's invoice panel and opens it
- **THEN** the invoice screen names its state with the same word the panel used

#### Scenario: The invoice list and the invoice screen agree

- **WHEN** the owner includes withdrawn bills in the invoice list and opens one
- **THEN** the list and the invoice screen use the same word for its state

#### Scenario: Not the word for a cancelled tenancy

- **WHEN** the owner reads a withdrawn bill on a tenancy screen that also names a cancelled tenancy
- **THEN** the two states are named with different words

#### Scenario: Withdrawing a bill

- **WHEN** the owner opens the dialog to withdraw a bill and confirms
- **THEN** its title, explanation, field label, button and the resulting state all use the same word, and no fragment of the dialog is in English
