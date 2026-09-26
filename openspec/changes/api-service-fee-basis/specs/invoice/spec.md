## MODIFIED Requirements

### Requirement: A lease's service fees are charged on its invoices

An invoice SHALL carry a line item for each service fee that applied to the lease during the period it bills, alongside rent, electricity and water.

Which fees applied SHALL be decided by the period each fee covers, not by what the lease holds today. A fee given up before the billed month SHALL NOT be charged, and a fee taken up after it SHALL NOT be charged, so that generating an invoice late reports what was true then rather than what is true now.

Each fee SHALL be charged at the unit amount that lease agreed, multiplied by what it is charged PER:

- a fee agreed as `perRoom` SHALL use the quantity the lease holds;
- a fee agreed as `perPerson` SHALL use the tenancy's occupant count AT BILLING TIME, exactly as water already does, and SHALL ignore the stored quantity. A person moving in therefore raises the next invoice with nothing for anybody to remember, and a per-person fee can never silently disagree with the water charged beside it.

The product SHALL then be prorated for the days of the billed month the fee actually applied — the overlap of the tenancy's occupied days with the fee's own period. A fee that applied for the whole of the occupied period SHALL NOT be reduced.

The line SHALL name the fee it came from, so a tenant reading the bill can tell parking from internet, and SHALL record the quantity and unit amount behind its amount as any other computed charge does. For a per-person fee the recorded quantity SHALL be the head count it was charged against, so the bill shows the arithmetic rather than an amount the tenant cannot check.

The line SHALL record the period the FEE applied for, not the tenancy's occupied month. Where a fee began or ended partway through, those are different spans, and recording the month makes a prorated amount impossible to check: a line reading "1 × 300.000 = 154.839" across a whole month is arithmetic the tenant cannot reproduce and will reasonably query. Rent and water do not have this problem because the span each shows is the span each was divided by; the fee line SHALL match that rule.

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

#### Scenario: A per-person fee follows the head count

- **WHEN** an invoice is generated for a lease holding a per-person fee, and the tenancy records three occupants
- **THEN** the line charges three times the agreed unit amount, and records three as its quantity

#### Scenario: Somebody moves in

- **WHEN** a tenancy's occupant count rises and the next month is billed
- **THEN** its per-person fees charge the new count, without anybody editing the fee

#### Scenario: A per-room fee is unaffected by the head count

- **WHEN** an invoice is generated for a lease holding a per-room fee and the occupant count changes
- **THEN** the fee charges the quantity the lease holds, unchanged

#### Scenario: A fee that began partway through the month

- **WHEN** an invoice is generated for a month in which a fee began on the 16th
- **THEN** the fee's line records the 16th to the month's end as its period, and the tenancy's own occupied period is unchanged on the rent, electricity and water lines

#### Scenario: A fee that stopped partway through the month

- **WHEN** an invoice is generated for a month in which a fee stopped on the 11th
- **THEN** the fee's line records the month's start to the 10th, the last day it applied

#### Scenario: A fee that applied all month

- **WHEN** a fee applied for the whole of the tenancy's occupied period
- **THEN** its line records that period, the same span the other lines carry
