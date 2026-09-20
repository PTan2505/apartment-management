## ADDED Requirements

### Requirement: A change to a cost's amount is confirmed before it is saved

The application SHALL ask the owner to confirm saving a correction that changes what a cost is worth, showing the previous amount and the new one.

A measured cost's quantity and rate are not editable once recorded — a correction changes its amount directly — so there is nothing else here to confirm.

A correction that changes only a cost's description, kind or date SHALL be saved without a confirmation step. Those are how a cost is found and filed; the amount is what a month's spending is built from.

#### Scenario: Correcting an amount

- **WHEN** an owner changes a cost's amount and saves
- **THEN** a confirmation shows the amount as old and new, and nothing is sent until it is confirmed

#### Scenario: Correcting a description

- **WHEN** an owner changes only a cost's description, kind or date and saves
- **THEN** it is saved without a confirmation step
