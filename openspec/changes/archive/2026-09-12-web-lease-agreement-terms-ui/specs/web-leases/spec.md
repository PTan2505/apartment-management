## ADDED Requirements

### Requirement: The agreed terms of a tenancy are readable on it

The application SHALL show, on a tenancy, the terms the agreement was made on: its reference, the notice required to end it, the day of the month rent falls due, the opening water reading, and the date the handover was signed.

These are the answers an owner is asked for by a tenant or needs in a dispute, and the tenancy is the only record that holds them. Keeping them out of the screen leaves the owner reading the paper contract to answer a question the system already knows.

Where a term has not been recorded, the screen SHALL say so rather than leave the space blank. A blank is read as a screen that failed rather than as a fact about the tenancy, and these fields are null on every tenancy signed before they existed.

#### Scenario: Reading the terms

- **WHEN** the owner opens a tenancy whose terms have been recorded
- **THEN** the reference, notice period, payment day, opening water reading and handover date are shown

#### Scenario: A term that was never recorded

- **WHEN** a tenancy has no value for one of these terms
- **THEN** the screen says it has not been recorded, rather than showing an empty space

### Requirement: The terms that can be recorded can be entered from the screen that reports them missing

The application SHALL let the owner supply the notice period, the payment day, the opening water reading and the handover date on an existing tenancy.

A screen that reports a value as missing and offers no way to supply it is a dead end, and these four are missing on every tenancy that predates them. The endpoint already accepts all four.

The reference SHALL NOT be editable. It is generated and never accepted from a caller: a typed reference drifts, and two tenancies sharing one makes both unfindable.

#### Scenario: Recording a term that was missing

- **WHEN** the owner enters a payment day on a tenancy that had none
- **THEN** it is saved and the tenancy shows it

#### Scenario: The reference is not offered for editing

- **WHEN** the owner edits the terms of a tenancy
- **THEN** the reference is not among the fields they can change

#### Scenario: A payment day outside the month

- **WHEN** the owner enters a payment day of 31
- **THEN** it is accepted, because it is the day the agreement names
