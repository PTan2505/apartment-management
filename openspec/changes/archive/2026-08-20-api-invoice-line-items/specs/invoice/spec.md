## ADDED Requirements

### Requirement: An invoice's charges are recorded as line items

Every charge on an invoice SHALL be recorded as its own line item, rather than as a field of the invoice. An invoice SHALL therefore be able to carry as many charges as it has, without the set of charges being fixed in advance.

A line item SHALL record what kind of charge it is, a description a reader can understand without knowing the system, and the amount charged. Where the charge was computed from a rate applied to a measured or counted quantity, it SHALL also record that quantity and that unit amount, so the reader can see how the figure was arrived at rather than being asked to trust it.

Where a charge was reduced because the tenancy occupied only part of the month, the recorded quantity and unit amount SHALL remain the full-month basis, and the amount SHALL be that basis reduced in proportion to the days occupied. The reduction belongs to the invoice's period, which the invoice already records, rather than being hidden inside a quantity that no longer means what it says.

The invoice's total SHALL equal the sum of its line items' amounts. It SHALL be recorded on the invoice and written together with the lines, so a caller reading a total never sees one that its lines do not account for.

Line items SHALL be reported in a stable order, so that the same invoice read twice presents its charges the same way.

#### Scenario: Charges appear as line items

- **WHEN** an authenticated owner retrieves an invoice
- **THEN** its rent, electricity, and water charges are each reported as a separate line item with its own amount

#### Scenario: The total equals the sum of the lines

- **WHEN** an authenticated owner retrieves an invoice
- **THEN** the invoice's total equals the sum of its line items' amounts

#### Scenario: A metered charge shows its quantity and rate

- **WHEN** an invoice's electricity charge is retrieved
- **THEN** it reports the units consumed and the rate applied, and its amount is those multiplied together

#### Scenario: A per-person charge shows its count and rate

- **WHEN** an invoice's water charge is retrieved
- **THEN** it reports the occupant count and the per-person rate, and its amount is those multiplied together for a full month

#### Scenario: A prorated charge keeps its full-month basis

- **WHEN** an invoice covers only part of a month and its rent charge is retrieved
- **THEN** the line reports the full monthly rent as its unit amount, and its amount is that rent reduced in proportion to the days occupied

#### Scenario: An invoice with no quantity behind a charge

- **WHEN** a charge was not computed from a quantity and a rate
- **THEN** its line item reports an amount without a quantity or unit amount, rather than reporting a fabricated quantity of one

#### Scenario: Line items are ordered consistently

- **WHEN** an authenticated owner retrieves the same invoice more than once
- **THEN** its line items are reported in the same order each time

## MODIFIED Requirements

### Requirement: Owner can generate an invoice for a lease and month
The system SHALL allow an authenticated `owner` to generate an invoice for a lease and a calendar month, supplying the closing electricity meter reading for that period. The invoice SHALL record the meter readings it spans, the period it covers, its line items, and the total. Each rate and count applied — the electricity rate, the water rate, the base rent, and the occupant count — SHALL be recorded on the line item it produced, so that a charge and the figures behind it are read together. A lease that has been finalized SHALL still be invoiceable for months it covered, because a tenancy that ended mid-month still owes a final bill.

#### Scenario: Successful generation
- **WHEN** an authenticated owner generates an invoice for a lease and month with a valid closing meter reading
- **THEN** the system creates the invoice and responds with HTTP 201, reporting the rent, electricity, and water charges as line items and their total

#### Scenario: Invoicing a finalized lease
- **WHEN** an authenticated owner generates an invoice for a month covered by a lease that has already recorded a move-out
- **THEN** the system creates the invoice, because the tenancy owes a bill for the period it occupied

#### Scenario: Lease does not exist
- **WHEN** an authenticated owner generates an invoice referencing a lease id that does not exist
- **THEN** the system responds with HTTP 404 and creates no invoice

#### Scenario: Month outside the lease period
- **WHEN** an authenticated owner generates an invoice for a month during which the lease had not started or had already ended
- **THEN** the system responds with HTTP 400 and creates no invoice

### Requirement: Applied rates and amounts are recorded on the invoice
The system SHALL copy every rate and count it applies onto the line item that charge produced, at the moment the invoice is generated, and SHALL record each charge and the total as amounts. The base rent copied SHALL be the rent agreed on the lease being billed, not the room's current base rent, because the tenant is billed what their agreement says. Changing a building's rates, a room's rent, a lease's agreed rent, or a lease's occupant count afterwards SHALL NOT alter any invoice already issued. Amounts SHALL be rounded to whole currency units, and the total SHALL equal the sum of the recorded charges.

#### Scenario: Later rate change does not alter an issued invoice
- **WHEN** a building's electricity rate is changed after an invoice was generated
- **THEN** that invoice's electricity line still reports the rate and charge that applied when it was created

#### Scenario: Later occupant count change does not alter an issued invoice
- **WHEN** a lease's occupant count is changed after an invoice was generated
- **THEN** that invoice's water line still reports the occupant count and charge that applied when it was created

#### Scenario: Rent billed is the rent agreed on the lease
- **WHEN** an invoice is generated for a lease whose agreed rent differs from its room's current base rent
- **THEN** the invoice's rent line records and charges the lease's agreed rent

#### Scenario: Changing the room's rent does not change what a running lease is billed
- **WHEN** a room's base rent is changed while a lease on that room is active, and an invoice is then generated for that lease
- **THEN** the invoice's rent line charges the lease's agreed rent, unaffected by the change

#### Scenario: Total equals the sum of its charges
- **WHEN** an authenticated owner retrieves an invoice
- **THEN** its total equals its line items' amounts added together, each already rounded to whole units
