## ADDED Requirements

### Requirement: The due report carries the rate each reading will be charged at

The report of what is due to be billed SHALL include, per tenancy, the electricity rate its invoice would apply.

It is there for the same reason the opening reading is there. A meter reading means nothing alone — what is billed is the difference, multiplied by a rate — and a caller showing an owner a number to check has only half of it without the multiplier. An owner who can see `160 kWh × 3.800` can tell a plausible figure from a wrong one before the invoice exists; one who sees `160 kWh` cannot.

The rate SHALL be the one the invoice would actually apply, resolved the same way, so that what the owner is shown before issuing and what the invoice records afterwards cannot disagree.

The alternative — a caller fetching each building to assemble it — is a request per row for a figure this report already holds, and a second copy of the rule that decides which rate applies.

#### Scenario: The rate accompanies the reading

- **WHEN** an authenticated owner asks what is due to be billed for a month
- **THEN** each tenancy reported carries the electricity rate its invoice would apply, alongside the reading it would open from

#### Scenario: The rate shown is the rate charged

- **WHEN** an invoice is issued for a tenancy that appeared in the report
- **THEN** the rate the invoice records is the one the report gave for it
