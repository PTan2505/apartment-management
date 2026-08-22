## ADDED Requirements

### Requirement: Owner-named charges are reported by category

The system SHALL report, per building and across the selection, what was charged in each ad-hoc category — damage, cleaning, a lost item, a penalty, other — over the range requested.

This mirrors the breakdown already reported for expenses, and deliberately so: `damage` charged to a tenant and `repair` paid to a builder are two halves of the same event, and an owner comparing them is asking whether they recovered what the damage cost. Reporting one broken down and the other only as a total would make that question unanswerable.

A category with nothing charged SHALL be reported as zero rather than omitted, so the shape of the response does not depend on the data in it.

These figures SHALL be a breakdown of what is already counted in `billed`, not an addition to it. An ad-hoc charge appears in both, once.

#### Scenario: Charges are broken down by category

- **WHEN** a range contains a damage charge of 200,000 and a cleaning charge of 300,000
- **THEN** the report shows 200,000 against damage and 300,000 against cleaning

#### Scenario: A category with nothing charged

- **WHEN** a range contains no penalty charges
- **THEN** the report shows a penalty figure of zero rather than omitting the category

#### Scenario: The breakdown does not double count

- **WHEN** a range contains a damage charge of 200,000
- **THEN** billed includes it once, and the sum of the category breakdown does not exceed billed

#### Scenario: Charges are comparable with expenses

- **WHEN** a range contains a damage charge of 200,000 and a repair expense of 180,000
- **THEN** both are reported in their own breakdowns, and the net figures reflect a gain of 20,000

## MODIFIED Requirements

### Requirement: Each month reports billed, collected, outstanding, expenses, and both net figures
The system SHALL report, for each building and month: the total billed, the total collected, the total outstanding, the total expenses incurred, and two net figures — billed less expenses, and collected less expenses. Because an invoice is paid in full or not at all, `billed` SHALL equal `collected` plus `outstanding` exactly.

A deposit SHALL NOT count towards any of these figures. It is money held on a tenant's behalf rather than earned, so counting it would inflate the month a tenant arrives and leave a hole in the month it is returned — reporting an owner as having earned money they may owe back.

A charge the owner named on an ad-hoc invoice SHALL count towards them in full. It is money earned: a tenant who broke a window owes for it, and the owner who repairs it records that cost separately as an expense. Excluding the charge while counting the repair would report a loss on damage the tenant paid for.

These figures SHALL therefore be built from the charges on an invoice rather than from its recorded total, since an invoice charging both a deposit and rent has a total larger than the revenue it represents. An invoice charging a deposit alone SHALL contribute nothing.

#### Scenario: Billed splits exactly into collected and outstanding
- **WHEN** a month contains both paid and unpaid invoices
- **THEN** collected is the sum of the paid ones, outstanding is the sum of the unpaid ones, and the two add up to billed

#### Scenario: A deposit is not counted as revenue
- **WHEN** a month contains a move-in invoice charging a deposit and a first month's rent
- **THEN** billed includes the rent and excludes the deposit

#### Scenario: An owner-named charge is counted as revenue
- **WHEN** a month contains an ad-hoc invoice charging 200,000 for damage
- **THEN** billed includes the whole 200,000

#### Scenario: A charge settled from the deposit is still collected
- **WHEN** an ad-hoc invoice is marked paid by deduction from the deposit
- **THEN** collected includes its charges, because the money reached the owner when the deposit was taken

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
