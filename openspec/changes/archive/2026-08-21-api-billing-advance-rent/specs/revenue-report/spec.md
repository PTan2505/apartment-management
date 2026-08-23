## MODIFIED Requirements

### Requirement: Each month reports billed, collected, outstanding, expenses, and both net figures
The system SHALL report, for each building and month: the total billed, the total collected, the total outstanding, the total expenses incurred, and two net figures — billed less expenses, and collected less expenses. Because an invoice is paid in full or not at all, `billed` SHALL equal `collected` plus `outstanding` exactly.

A deposit SHALL NOT count towards any of these figures. It is money held on a tenant's behalf rather than earned, so counting it would inflate the month a tenant arrives and leave a hole in the month it is returned — reporting an owner as having earned money they may owe back.

These figures SHALL therefore be built from the charges on an invoice rather than from its recorded total, since an invoice charging both a deposit and rent has a total larger than the revenue it represents. An invoice charging a deposit alone SHALL contribute nothing.

#### Scenario: Billed splits exactly into collected and outstanding
- **WHEN** a month contains both paid and unpaid invoices
- **THEN** collected is the sum of the paid ones, outstanding is the sum of the unpaid ones, and the two add up to billed

#### Scenario: A deposit is not counted as revenue
- **WHEN** a month contains a move-in invoice charging a deposit and a first month's rent
- **THEN** billed includes the rent and excludes the deposit

#### Scenario: Paying a move-in invoice collects only its revenue
- **WHEN** a move-in invoice charging a deposit and rent is recorded as paid
- **THEN** collected increases by the rent alone

#### Scenario: An invoice's total may exceed what it contributes
- **WHEN** an invoice charges both a deposit and revenue
- **THEN** the figure it contributes to the report is less than its recorded total, and the invoice's own total is unchanged

#### Scenario: A month where everything is paid
- **WHEN** every invoice for a month has been paid
- **THEN** collected equals billed and outstanding is zero

#### Scenario: A month where nothing is paid
- **WHEN** no invoice for a month has been paid
- **THEN** outstanding equals billed and collected is zero

#### Scenario: Both net figures are reported
- **WHEN** a month has billed and collected amounts and recorded expenses
- **THEN** the response reports one net figure of billed less expenses and another of collected less expenses

#### Scenario: Net figures may be negative
- **WHEN** a month's expenses exceed what was collected
- **THEN** the collected-based net figure is reported as a negative amount rather than clamped to zero

### Requirement: Billing figures are keyed on the month billed
The system SHALL attribute every invoice to the month it was **issued** rather than the date it was paid, so that a month's figures remain comparable to other months instead of changing as late payments arrive. Voided invoices SHALL be excluded from every figure.

The month issued is used rather than the month covered because not every invoice covers one. A move-in invoice charges a deposit and rent and has no month of metered occupancy at all, so there is no month it could be attributed to. Issuing is the one thing every invoice has.

It also answers the question an owner asks of this report — what did I bill out in March — for a bill that settles February's utilities alongside March's rent, and belongs wholly to neither.

#### Scenario: An invoice paid in a later month
- **WHEN** an invoice is paid during a month later than the one it was issued in
- **THEN** it counts toward the month it was issued, in both the billed and collected figures, and not toward the month it was paid in

#### Scenario: A move-in invoice is attributed to the month it was issued
- **WHEN** a move-in invoice, which covers no month of occupancy, is included in the report
- **THEN** it counts toward the month it was issued

#### Scenario: A month billed late counts where it was billed
- **WHEN** an invoice covering an earlier month is issued with a later issue date
- **THEN** it counts toward the month of that issue date rather than the month it covers

#### Scenario: Voided invoices are excluded
- **WHEN** an invoice has been voided
- **THEN** it contributes to no figure in the report
