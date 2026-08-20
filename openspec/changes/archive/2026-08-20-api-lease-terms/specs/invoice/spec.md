## MODIFIED Requirements

### Requirement: Applied rates and amounts are recorded on the invoice
The system SHALL copy the electricity rate, water rate, base rent, and occupant count onto the invoice when it is generated, and SHALL record each charge and the total as amounts. The base rent copied SHALL be the rent agreed on the lease being billed, not the room's current base rent, because the tenant is billed what their agreement says. Changing a building's rates, a room's rent, a lease's agreed rent, or a lease's occupant count afterwards SHALL NOT alter any invoice already issued. Amounts SHALL be rounded to whole currency units, and the total SHALL equal the sum of the recorded charges.

#### Scenario: Later rate change does not alter an issued invoice
- **WHEN** a building's electricity rate is changed after an invoice was generated
- **THEN** that invoice still reports the rate and charge that applied when it was created

#### Scenario: Later occupant count change does not alter an issued invoice
- **WHEN** a lease's occupant count is changed after an invoice was generated
- **THEN** that invoice still reports the occupant count and water charge that applied when it was created

#### Scenario: Rent billed is the rent agreed on the lease
- **WHEN** an invoice is generated for a lease whose agreed rent differs from its room's current base rent
- **THEN** the invoice records and charges the lease's agreed rent

#### Scenario: Changing the room's rent does not change what a running lease is billed
- **WHEN** a room's base rent is changed while a lease on that room is active, and an invoice is then generated for that lease
- **THEN** the invoice charges the lease's agreed rent, unaffected by the change

#### Scenario: Total equals the sum of its charges
- **WHEN** an authenticated owner retrieves an invoice
- **THEN** its total equals the recorded rent, electricity, and water charges added together, each already rounded to whole units
