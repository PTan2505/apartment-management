## Purpose

Turns a tenancy into a monthly bill: metered electricity, per-person water, and rent for the days occupied, recorded with the rates that were applied so the bill stays a faithful record of what was charged.

## Requirements

### Requirement: Owner can generate an invoice for a lease and month
The system SHALL allow an authenticated `owner` to generate an invoice for a lease and a calendar month, supplying the closing electricity meter reading for that period. The invoice SHALL record the meter readings it spans, the electricity rate, water rate, base rent, and occupant count applied, the amount of each charge, and the total. A lease that has been finalized SHALL still be invoiceable for months it covered, because a tenancy that ended mid-month still owes a final bill.

#### Scenario: Successful generation
- **WHEN** an authenticated owner generates an invoice for a lease and month with a valid closing meter reading
- **THEN** the system creates the invoice and responds with HTTP 201, reporting the rent, electricity, and water charges and their total

#### Scenario: Invoicing a finalized lease
- **WHEN** an authenticated owner generates an invoice for a month covered by a lease that has already recorded a move-out
- **THEN** the system creates the invoice, because the tenancy owes a bill for the period it occupied

#### Scenario: Lease does not exist
- **WHEN** an authenticated owner generates an invoice referencing a lease id that does not exist
- **THEN** the system responds with HTTP 404 and creates no invoice

#### Scenario: Month outside the lease period
- **WHEN** an authenticated owner generates an invoice for a month during which the lease had not started or had already ended
- **THEN** the system responds with HTTP 400 and creates no invoice

### Requirement: One invoice per lease per month
The system SHALL reject a second invoice for a lease and month that already has one, so re-running billing cannot double-charge a tenant. A room MAY have more than one invoice for the same month when it was occupied by more than one lease during it, because each tenancy is billed separately.

#### Scenario: Duplicate invoice for the same lease and month
- **WHEN** an authenticated owner generates an invoice for a lease and month that already has an invoice
- **THEN** the system responds with HTTP 409 and the existing invoice is unchanged

#### Scenario: Two tenancies billed for the same room and month
- **WHEN** a room was occupied by one lease for part of a month and another lease for the rest, and an invoice is generated for each
- **THEN** both invoices are created, because the constraint applies per lease rather than per room

### Requirement: Electricity is charged on metered consumption
The system SHALL compute electricity as the closing meter reading minus the opening reading for the period, multiplied by the building's electricity rate. The opening reading for a lease's first invoice SHALL be the meter reading recorded when the lease started; for every later invoice it SHALL be the closing reading of that lease's previous invoice. Electricity SHALL NOT be prorated by days, because the reading already measures exactly what was consumed.

#### Scenario: First invoice of a lease
- **WHEN** an authenticated owner generates the first invoice for a lease
- **THEN** the electricity charge is based on the closing reading minus the meter reading recorded when that lease started

#### Scenario: Subsequent invoice of a lease
- **WHEN** an authenticated owner generates an invoice for a lease that already has an earlier invoice
- **THEN** the electricity charge is based on the closing reading minus the previous invoice's closing reading

#### Scenario: A new tenancy is not charged for a previous one's consumption
- **WHEN** a room's previous lease closed at a meter reading and a new lease started from that same reading
- **THEN** the new lease's first invoice charges only the consumption recorded since the new lease began

#### Scenario: Electricity is not reduced for a partial month
- **WHEN** an authenticated owner generates an invoice for a lease that occupied only part of the month
- **THEN** the electricity charge reflects the full metered consumption for the period and is not scaled by the days occupied

#### Scenario: Closing reading below the opening reading
- **WHEN** an authenticated owner supplies a closing meter reading lower than the opening reading for the period
- **THEN** the system responds with HTTP 400 and creates no invoice, rather than producing a negative charge

### Requirement: Rent and water are prorated for a partial month
The system SHALL charge rent and water in proportion to the days of the month the lease was occupied, using the actual number of days in that month and counting the first and last day of occupancy inclusively. A lease covering the whole month SHALL be charged in full without proration. Water SHALL be the occupant count multiplied by the building's per-person water rate before proration is applied.

#### Scenario: Full month is not prorated
- **WHEN** an authenticated owner generates an invoice for a month the lease occupied in full
- **THEN** rent is the room's full base rent and water is the full occupant count multiplied by the water rate

#### Scenario: Lease starting mid-month
- **WHEN** an authenticated owner generates an invoice for the month a lease began partway through
- **THEN** rent and water are charged for the days from the start date to the end of the month, as a proportion of that month's actual length

#### Scenario: Lease ending mid-month
- **WHEN** an authenticated owner generates an invoice for the month a lease recorded its move-out
- **THEN** rent and water are charged for the days from the start of the month up to and including the move-out date

#### Scenario: Lease starting and ending within one month
- **WHEN** an authenticated owner generates an invoice for a month a lease both began and ended within
- **THEN** rent and water are charged only for the days between those two dates inclusively

#### Scenario: Proration follows the month's actual length
- **WHEN** invoices are generated for equivalent partial occupancies in a 28-day month and a 31-day month
- **THEN** each is calculated against its own month's length rather than a fixed 30-day month

### Requirement: Applied rates and amounts are recorded on the invoice
The system SHALL copy the electricity rate, water rate, base rent, and occupant count onto the invoice when it is generated, and SHALL record each charge and the total as amounts. Changing a building's rates, a room's rent, or a lease's occupant count afterwards SHALL NOT alter any invoice already issued. Amounts SHALL be rounded to whole currency units, and the total SHALL equal the sum of the recorded charges.

#### Scenario: Later rate change does not alter an issued invoice
- **WHEN** a building's electricity rate is changed after an invoice was generated
- **THEN** that invoice still reports the rate and charge that applied when it was created

#### Scenario: Later occupant count change does not alter an issued invoice
- **WHEN** a lease's occupant count is changed after an invoice was generated
- **THEN** that invoice still reports the occupant count and water charge that applied when it was created

#### Scenario: Total equals the sum of its charges
- **WHEN** an authenticated owner retrieves an invoice
- **THEN** its total equals the recorded rent, electricity, and water charges added together, each already rounded to whole units

### Requirement: Owner can record payment of an invoice
The system SHALL treat a new invoice as pending, and SHALL allow an authenticated `owner` to mark it paid, recording the payment method and the date it was paid. The payment date SHALL be recorded separately from the month the invoice covers, so a bill for one month paid in another is reported correctly by both measures.

#### Scenario: New invoice is pending
- **WHEN** an authenticated owner generates an invoice
- **THEN** its payment status is pending, with no payment method or payment date recorded

#### Scenario: Marking an invoice paid
- **WHEN** an authenticated owner marks a pending invoice paid with a payment method and date
- **THEN** the invoice reports itself as paid and retains the method and date recorded

#### Scenario: Payment date differs from the billed month
- **WHEN** an invoice covering one month is marked paid with a date in a later month
- **THEN** the invoice retains both the month it covers and the date it was paid, as distinct values

#### Scenario: Marking an already paid invoice paid
- **WHEN** an authenticated owner marks an invoice paid that has already been paid
- **THEN** the system responds with HTTP 409 and the original payment details are unchanged

#### Scenario: Invalid payment method
- **WHEN** an authenticated owner marks an invoice paid with a method that is neither cash nor bank transfer
- **THEN** the system responds with HTTP 400 and the invoice remains pending

### Requirement: Owner can void an invoice and reissue it
The system SHALL allow an authenticated `owner` to void an invoice rather than edit it, and SHALL allow a replacement invoice to be generated for the same lease and month once the original is voided. A voided invoice SHALL be retained, and SHALL be excluded from amounts owed and collected. The system SHALL NOT allow the figures on an issued invoice to be altered in place.

#### Scenario: Voiding an invoice
- **WHEN** an authenticated owner voids an invoice
- **THEN** the invoice is reported as voided, its record is retained, and it no longer counts toward amounts owed or collected

#### Scenario: Reissuing after a void
- **WHEN** an authenticated owner generates an invoice for a lease and month whose only existing invoice has been voided
- **THEN** the system creates the replacement invoice, because the voided one no longer occupies that period

#### Scenario: Voiding an already voided invoice
- **WHEN** an authenticated owner voids an invoice that is already voided
- **THEN** the system responds with HTTP 409

### Requirement: Owner can list, filter, and retrieve invoices
The system SHALL allow an authenticated `owner` to retrieve an invoice by id and to list invoices filtered by building, room, lease, billed month, and payment status. Listing SHALL use the shared paginated response contract.

#### Scenario: Filtering by month
- **WHEN** an authenticated owner lists invoices for a given year and month
- **THEN** the response contains only invoices covering that month

#### Scenario: Filtering by payment status
- **WHEN** an authenticated owner lists invoices filtered to pending ones
- **THEN** the response contains only invoices that have not been paid or voided

#### Scenario: Filtering by building
- **WHEN** an authenticated owner lists invoices filtered by a building id
- **THEN** the response contains only invoices for rooms in that building

#### Scenario: Retrieving an invoice that does not exist
- **WHEN** an authenticated owner requests an invoice id that does not exist
- **THEN** the system responds with HTTP 404

#### Scenario: Invoice listing is paginated
- **WHEN** an authenticated owner lists invoices
- **THEN** the response is the shared paginated shape, with the invoices in `data` and the page, page size, and totals in `meta`

### Requirement: Invoice endpoints require an authenticated owner
The system SHALL reject any invoice request that is unauthenticated or made by a user whose role is not `owner`.

#### Scenario: Unauthenticated request
- **WHEN** a request to any invoice endpoint has no valid access token
- **THEN** the system responds with HTTP 401 and does not process the request

#### Scenario: Authenticated non-owner request
- **WHEN** a request to any invoice endpoint carries a valid access token for a user whose role is not `owner`
- **THEN** the system responds with HTTP 403 and does not process the request
