## ADDED Requirements

### Requirement: A lease's service fees are charged on its invoices

An invoice SHALL carry a line item for each service fee that applied to the lease during the period it bills, alongside rent, electricity and water.

Which fees applied SHALL be decided by the period each fee covers, not by what the lease holds today. A fee given up before the billed month SHALL NOT be charged, and a fee taken up after it SHALL NOT be charged, so that generating an invoice late reports what was true then rather than what is true now.

Each fee SHALL be charged at the unit amount that lease agreed and the quantity it holds, and SHALL be prorated for the days of the billed month it actually applied — the overlap of the tenancy's occupied days with the fee's own period. A fee that applied for the whole of the occupied period SHALL NOT be reduced.

The line SHALL name the fee it came from, so a tenant reading the bill can tell parking from internet, and SHALL record the quantity and unit amount behind its amount as any other computed charge does.

The invoice's total SHALL include these charges, and SHALL continue to equal the sum of its line items.

Rent, electricity, and water SHALL be unaffected. An invoice for a lease with no service fees SHALL be identical to the one the same inputs produced before.

#### Scenario: A fee appears on the invoice

- **WHEN** an authenticated owner generates an invoice for a lease holding a parking fee
- **THEN** the invoice carries a line for parking, naming it, with its quantity, unit amount and amount

#### Scenario: The total includes the fees

- **WHEN** an invoice carries service fee lines
- **THEN** its total equals rent, electricity, water and those fees added together

#### Scenario: A lease with no service fees is unchanged

- **WHEN** an authenticated owner generates an invoice for a lease holding no service fees
- **THEN** the invoice's charges and total are exactly what the same inputs produced before service fees were billed

#### Scenario: A fee applying for the whole month is not reduced

- **WHEN** an invoice covers a month the lease occupied in full, and a fee applied throughout it
- **THEN** that fee is charged at its full monthly amount

#### Scenario: A fee taken up partway through the month

- **WHEN** a fee began applying partway through the billed month
- **THEN** it is charged for the days from that date to the end of the occupied period, as a proportion of the month's actual length

#### Scenario: A fee given up partway through the month

- **WHEN** a lease gave up a fee partway through the billed month
- **THEN** it is charged for the days up to that date rather than the whole month

#### Scenario: A fee given up before the billed month

- **WHEN** an invoice is generated for a month after the lease gave up a fee
- **THEN** that fee is not charged

#### Scenario: A fee taken up after the billed month

- **WHEN** an invoice is generated for a month before the lease took up a fee
- **THEN** that fee is not charged, even though the lease holds it now

#### Scenario: A fee is prorated alongside a partial tenancy

- **WHEN** an invoice covers a month the lease occupied only part of, and a fee applied throughout the tenancy
- **THEN** the fee is charged for the occupied days, on the same basis as water

#### Scenario: Several fees each get their own line

- **WHEN** a lease holds parking, internet and rubbish
- **THEN** the invoice carries three separate lines, each named, rather than one combined charge

#### Scenario: A later price change does not alter an issued invoice

- **WHEN** a building's service fee is repriced after an invoice charging it was generated
- **THEN** that invoice's line still reports the amount that applied when it was created
