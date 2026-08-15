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
The system SHALL attribute every invoice to the month it covers rather than the date it was paid, so that a month's figures remain comparable to other months instead of changing as late payments arrive. Voided invoices SHALL be excluded from every figure.

#### Scenario: An invoice paid in a later month
- **WHEN** an invoice covering one month is paid during a later month
- **THEN** it counts toward the month it covers, in both the billed and collected figures, and not toward the month it was paid in

#### Scenario: Voided invoices are excluded
- **WHEN** an invoice has been voided
- **THEN** it contributes to no figure in the report

### Requirement: Each month reports billed, collected, outstanding, expenses, and both net figures
The system SHALL report, for each building and month: the total billed, the total collected, the total outstanding, the total expenses incurred, and two net figures — billed less expenses, and collected less expenses. Because an invoice is paid in full or not at all, `billed` SHALL equal `collected` plus `outstanding` exactly.

#### Scenario: Billed splits exactly into collected and outstanding
- **WHEN** a month contains both paid and unpaid invoices
- **THEN** collected is the sum of the paid ones, outstanding is the sum of the unpaid ones, and the two add up to billed

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
