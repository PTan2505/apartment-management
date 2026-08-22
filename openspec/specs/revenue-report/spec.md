## Purpose

Answers what a property earned and what it cost over a period: how much was billed to tenants, how much of that has arrived, what remains outstanding, and what the owner spent running the place.

## Requirements

### Requirement: Owner can request a revenue report over a range of months
The system SHALL allow an authenticated `owner` to request a revenue report for a range of months, optionally limited to selected buildings. The range SHALL be inclusive of both its first and last month, and its start MUST NOT fall after its end. Where no buildings are named, the report SHALL cover every building, including retired ones, because a retired building's historical earnings remain part of the record.

#### Scenario: Report over a range of months
- **WHEN** an authenticated owner requests a report from one month to a later one
- **THEN** the system responds with HTTP 200 and figures covering every month from the first to the last inclusively

#### Scenario: Report limited to selected buildings
- **WHEN** an authenticated owner requests a report naming specific buildings
- **THEN** the response covers only those buildings

#### Scenario: Report covering all buildings
- **WHEN** an authenticated owner requests a report without naming any building
- **THEN** the response covers every building, retired ones included

#### Scenario: Range starting after it ends
- **WHEN** an authenticated owner requests a report whose start month falls after its end month
- **THEN** the system responds with HTTP 400

#### Scenario: Single-month range
- **WHEN** an authenticated owner requests a report whose start and end month are the same
- **THEN** the response covers that one month

#### Scenario: Building that does not exist
- **WHEN** an authenticated owner names a building id that does not exist
- **THEN** the system responds with HTTP 404

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

### Requirement: Expenses are attributed to the month they were incurred
The system SHALL attribute each expense to the month of its incurred date, and SHALL include expenses recorded against a building directly as well as those recorded against one of its rooms.

#### Scenario: Room-level expenses count toward their building
- **WHEN** an expense is recorded against a room
- **THEN** it counts toward that room's building in the report

#### Scenario: Building-level expenses count toward their building
- **WHEN** an expense is recorded against a building without naming a room
- **THEN** it counts toward that building in the report

#### Scenario: Expenses fall in the month they were incurred
- **WHEN** an expense was incurred in one month
- **THEN** it counts toward that month, regardless of when it was entered into the system

### Requirement: Totals are reported per building and across the selection
The system SHALL report monthly rows for each building, a total for each building across the range, and a grand total across every building in the selection. The building totals and grand total SHALL each break expenses down by category.

#### Scenario: Per-building monthly rows
- **WHEN** an authenticated owner requests a report covering several buildings and months
- **THEN** each building carries a row for every month in the range

#### Scenario: Building totals
- **WHEN** a building has figures across several months
- **THEN** that building's total equals the sum of its monthly rows

#### Scenario: Grand total across buildings
- **WHEN** a report covers several buildings
- **THEN** the grand total equals the sum of the building totals

#### Scenario: Expenses broken down by category
- **WHEN** a building's expenses span several categories
- **THEN** its total reports the amount for each category, and those amounts add up to its expense total

### Requirement: Months and buildings with no activity are reported as zero
The system SHALL include every month in the requested range and every building in the selection, reporting zero figures where there was no activity, so that a caller need not fill gaps itself.

#### Scenario: A month with no invoices or expenses
- **WHEN** a building had no activity during one month of the requested range
- **THEN** that month still appears for that building, with every figure reported as zero

#### Scenario: A building with no activity at all
- **WHEN** an authenticated owner names a building that has no invoices or expenses in the range
- **THEN** that building still appears, with zero figures throughout

### Requirement: The report is not a paginated list
The system SHALL return the revenue report as a single aggregate structure rather than the shared paginated response contract used by list endpoints, because the report is a computed summary rather than a collection of records.

#### Scenario: Report response is not paginated
- **WHEN** an authenticated owner requests a revenue report
- **THEN** the response is the report structure itself, carrying no page, page size, or total-count metadata

### Requirement: Revenue report requires an authenticated owner
The system SHALL reject any revenue report request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to the revenue report has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to the revenue report carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
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
