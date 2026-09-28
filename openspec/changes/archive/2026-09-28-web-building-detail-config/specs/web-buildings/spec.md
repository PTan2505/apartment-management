## ADDED Requirements

### Requirement: A building's page states what it is configured to

The building's own page SHALL show what the owner has set it to: its electricity rate,
its water rate per person, the number of months of rent its tenancies take as a deposit
by default, and the service fees it charges beside rent.

Each figure SHALL be shown as a named field rather than as running text, and SHALL say
what it reaches: a rate applies to tenancies signed from then on, and the deposit is the
figure a new tenancy falls back to. A reader must be able to tell a SETTING from the
building's address, which sits directly above it.

A building with no service fees SHALL say so, rather than showing an empty area.

Nothing here is narrowed by role. A manager reads every figure — they quote the rates
when they sign a tenancy — and what they lose is only the ability to change them.

#### Scenario: The owner opens a building

- **WHEN** the owner opens a building's page
- **THEN** its electricity rate, water rate, default deposit months and service fees are shown, each named, with what it applies to stated

#### Scenario: A building that charges nothing beyond rent

- **WHEN** a building has no service fees configured
- **THEN** the page says it has none rather than leaving the area blank

#### Scenario: A manager opens a building

- **WHEN** a manager opens a building they cover
- **THEN** they see the same figures, including the fee catalogue

#### Scenario: A building that takes no deposit

- **WHEN** a building's default deposit is zero months
- **THEN** the page says it takes no deposit rather than showing "0 tháng"

### Requirement: The owner edits a building from its own page

The page SHALL offer the owner a control that opens the same form the buildings list
uses, and on saving SHALL show the new values without the owner reloading.

The control SHALL NOT be shown to anyone else, by the rule that a control a role may not
use is not drawn.

#### Scenario: The owner changes a setting

- **WHEN** the owner edits a building from its page and saves
- **THEN** the form closes and the page shows the changed figure without a reload

#### Scenario: A manager reads the same page

- **WHEN** a manager opens a building's page
- **THEN** no control offers to edit it
