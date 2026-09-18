## ADDED Requirements

### Requirement: A tenancy's charges use the rates that tenancy was signed at
Every charge raised against a tenancy SHALL be computed from the rates recorded on that tenancy — its rent, its electricity rate and its water rate — and SHALL NOT read the building's current rates.

This SHALL hold for every invoice a tenancy can carry: its move-in invoice, its monthly invoices, and any invoice issued for it after its building's rates were changed.

The rate applied SHALL continue to be recorded on the line item it produced, so a bill remains readable as what was charged and why.

Electricity for a room standing EMPTY SHALL keep using the building's current rate, because no tenancy exists to have agreed anything and the cost is the owner's own.

#### Scenario: A monthly invoice after a rate change
- **GIVEN** a tenancy signed at one electricity rate, and a building whose electricity rate was raised afterwards
- **WHEN** the owner generates a monthly invoice for that tenancy
- **THEN** the electricity charge uses the rate the tenancy was signed at, and the line item records that rate

#### Scenario: Water after a rate change
- **GIVEN** a tenancy signed at one water rate, and a building whose water rate was changed afterwards
- **WHEN** the owner generates a monthly invoice for that tenancy
- **THEN** the water charge uses the rate the tenancy was signed at

#### Scenario: A tenancy signed after the change
- **GIVEN** a building whose rates were changed
- **WHEN** a tenancy is signed afterwards and billed
- **THEN** its charges use the changed rates

#### Scenario: Vacancy electricity follows the building
- **GIVEN** a room with no tenancy running
- **WHEN** the owner records a vacancy meter reading for it
- **THEN** the cost is computed from the building's current electricity rate
