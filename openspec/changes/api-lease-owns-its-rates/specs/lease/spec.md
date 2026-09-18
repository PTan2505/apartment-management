## ADDED Requirements

### Requirement: A tenancy records the utility rates it was signed at
A tenancy SHALL record the electricity rate per kWh and the water rate per person that applied when it was created, defaulting to its building's current rates exactly as the agreed rent defaults to the room's.

Either rate MAY be supplied when the tenancy is created, so a price agreed with one tenant in particular is recorded without changing what the building charges the next one. Neither MAY be negative.

The rates SHALL be recorded at the same precision the building holds them at, so the copy can neither lose nor gain digits.

Editing a building's rates afterwards SHALL NOT alter any tenancy already signed, because those figures are what the tenant agreed to. A tenancy signed after the edit SHALL record the new figures.

The recorded rates SHALL be reported wherever a tenancy is returned, so a screen can show what this tenancy is billed at without reading its building.

#### Scenario: A new tenancy copies its building's rates
- **WHEN** an authenticated owner creates a tenancy without naming rates
- **THEN** the tenancy records its building's electricity and water rates as they stand at that moment

#### Scenario: A rate agreed with this tenant
- **WHEN** an authenticated owner creates a tenancy naming an electricity rate of its own
- **THEN** the tenancy records that rate, the building's rate is unchanged, and the tenancy's invoices are computed from the rate it recorded

#### Scenario: Editing the building leaves signed tenancies alone
- **GIVEN** a tenancy signed while its building charged one set of rates
- **WHEN** the owner changes the building's rates
- **THEN** the tenancy still records the rates it was signed at

#### Scenario: A tenancy signed after the edit takes the new rates
- **GIVEN** a building whose rates have been changed
- **WHEN** the owner signs a new tenancy in it
- **THEN** that tenancy records the changed rates

#### Scenario: A tenancy reports its rates
- **WHEN** an authenticated owner retrieves or lists tenancies
- **THEN** each carries the electricity and water rates it was signed at

### Requirement: The rates on a running tenancy can be corrected
The system SHALL allow an authenticated `owner` to change the electricity and water rates recorded on a tenancy that is running, alongside the other terms it already allows correcting.

Without this, a tenancy's rates could only be changed by renewing it early, because the figures live on the tenancy. The same path serves a rate mistyped at signing and a rate the parties have since agreed to change.

Changing them SHALL affect what that tenancy is billed FROM THEN ON, and SHALL NOT alter invoices already issued: each invoice records the rate that produced each of its charges.

Changing them SHALL affect only that tenancy — not its building, and not any other tenancy in it.

Neither rate SHALL be negative. A tenancy that has recorded a move-out, or that was cancelled, SHALL refuse the change as it already refuses every other correction.

#### Scenario: Correcting a rate
- **WHEN** an authenticated owner changes the electricity rate on a running tenancy
- **THEN** the tenancy records the new rate, and its next invoice charges at it

#### Scenario: Invoices already issued do not move
- **GIVEN** a tenancy with an invoice already issued at its old rate
- **WHEN** the owner changes that tenancy's rate
- **THEN** the issued invoice keeps its own line items and its own recorded rate

#### Scenario: The building is not touched
- **WHEN** the owner changes a tenancy's rates
- **THEN** the building's rates are unchanged, and no other tenancy's rates change

#### Scenario: A negative rate is refused
- **WHEN** an authenticated owner submits a negative rate
- **THEN** the system responds with HTTP 400 and changes nothing
