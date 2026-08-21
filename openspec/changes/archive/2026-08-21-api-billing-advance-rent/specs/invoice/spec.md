## ADDED Requirements

### Requirement: An invoice carries only what its kind has

An invoice's calendar month, its period, and its meter readings SHALL be recorded only where the invoice has them. They describe a span of occupancy whose utilities were metered, which a move-in invoice does not have and an overdue invoice does not have in the same sense.

Each kind SHALL carry:

- **Move-in** — no month, no period, no meter readings. It charges a deposit and rent, neither of which is metered.
- **Monthly** — the month whose utilities it covers, that month's occupied period, and the readings spanning it.
- **Final** — the month of departure, the occupied period ending at the departure, and the readings spanning it.
- **Overdue** — the period beyond the agreed term, and no meter readings, because the closing reading was already consumed by the final invoice.

The calendar month SHALL continue to mean the period whose **utilities** the invoice covers, unchanged by rent moving a month ahead.

#### Scenario: A move-in invoice has no utilities period

- **WHEN** an authenticated owner retrieves a move-in invoice
- **THEN** it reports no calendar month, no period and no meter readings, because it charges nothing that was metered

#### Scenario: A monthly invoice still reports its utilities period

- **WHEN** an authenticated owner retrieves a monthly invoice
- **THEN** it reports the month whose utilities it covers, that month's occupied period, and the readings spanning it

#### Scenario: A final invoice reports the period ending at departure

- **WHEN** an authenticated owner retrieves a final invoice
- **THEN** its period ends on the last day the tenancy covered, and its readings span that period

### Requirement: A line item records the period it covers

Each line item SHALL record the period its charge is for, where it has one. A bill carrying one month's utilities beside the following month's rent SHALL say so on each line, rather than leaving a reader to work out which of two periods a charge belongs to from its kind.

A charge with no period — a deposit — SHALL record none rather than borrowing the invoice's.

Where an invoice has a period of its own, a line's period SHALL fall within the span the invoice concerns or the month it charges rent for; it SHALL NOT contradict them.

#### Scenario: Utilities and rent report different periods

- **WHEN** an authenticated owner retrieves a monthly invoice covering January's utilities and February's rent
- **THEN** the utilities lines report January and the rent line reports February

#### Scenario: A deposit line has no period

- **WHEN** an authenticated owner retrieves a move-in invoice
- **THEN** its deposit line reports no period, because a deposit is not charged for a span of time

#### Scenario: A reader can tell which month a charge is for

- **WHEN** an authenticated owner retrieves any invoice
- **THEN** every charge computed for a span of time reports that span

### Requirement: A move-in invoice charges the deposit and the first month's rent

Creating a lease SHALL issue a move-in invoice for it, charging the deposit agreed on that lease and the rent for the month the tenancy begins. The two SHALL be issued together with the lease, so a tenancy never exists without the bill that starts it.

The rent charged SHALL cover from the lease's start date to the end of that calendar month. A tenancy beginning partway through a month SHALL therefore be charged for the remainder of it rather than a whole month, and the following monthly invoice SHALL charge the next month in full.

The deposit SHALL be charged as its own kind of line, at the amount the lease agreed. A lease agreed with no deposit SHALL carry no deposit line rather than a line of zero.

A lease SHALL have at most one move-in invoice.

#### Scenario: Creating a lease issues its move-in invoice

- **WHEN** an authenticated owner creates a lease with a two-month deposit
- **THEN** a move-in invoice is issued for it, charging the deposit and the first month's rent

#### Scenario: A tenancy beginning mid-month is charged for the remainder

- **WHEN** an authenticated owner creates a lease beginning on the 15th of a 31-day month
- **THEN** the move-in invoice charges rent for the 17 days from the 15th to the end of that month

#### Scenario: A tenancy beginning on the first is charged the whole month

- **WHEN** an authenticated owner creates a lease beginning on the first of a month
- **THEN** the move-in invoice charges that month's rent in full

#### Scenario: A lease with no deposit has no deposit line

- **WHEN** an authenticated owner creates a lease agreed with a deposit of zero months
- **THEN** its move-in invoice charges rent alone, with no deposit line

#### Scenario: The deposit is charged at the lease's agreed amount

- **WHEN** a lease agreed rent of 3,000,000 and a deposit of two months
- **THEN** its move-in invoice charges a deposit of 6,000,000

#### Scenario: A lease has one move-in invoice

- **WHEN** an authenticated owner retrieves the invoices for a lease
- **THEN** exactly one of them is a move-in invoice

#### Scenario: A failed invoice leaves no lease behind

- **WHEN** issuing the move-in invoice fails while a lease is being created
- **THEN** neither the lease nor the invoice exists, because a tenancy without its opening bill is a half-recorded fact

### Requirement: A final invoice charges utilities to the departure

Recording a move-out SHALL issue a final invoice for the lease, charging the utilities of the month of departure up to the last day the tenancy covered, and **no rent**. The rent for that month was charged a month earlier, on the monthly invoice preceding it.

The final invoice SHALL be issued together with the move-out, so a tenancy cannot be closed without its closing bill.

Its electricity SHALL be computed from the closing reading taken at handover against the opening reading its lease's billing had reached, on the same basis as any other invoice.

A lease SHALL have at most one final invoice.

#### Scenario: Recording a move-out issues the final invoice

- **WHEN** an authenticated owner records a move-out with a closing meter reading
- **THEN** a final invoice is issued charging that month's utilities to the departure

#### Scenario: The final invoice charges no rent

- **WHEN** an authenticated owner retrieves a final invoice
- **THEN** it carries no rent line, because that month's rent was charged on the previous monthly invoice

#### Scenario: Utilities are charged to the day of departure

- **WHEN** a tenancy departs partway through a month
- **THEN** the final invoice's water and service fees cover the days up to the departure rather than the whole month

#### Scenario: Electricity closes the lease's chain

- **WHEN** a final invoice is issued
- **THEN** its electricity is the closing reading less the reading that lease's billing had reached

#### Scenario: A failed invoice leaves the tenancy open

- **WHEN** issuing the final invoice fails while a move-out is being recorded
- **THEN** the move-out is not recorded either, so the tenancy is not closed without its closing bill

### Requirement: An overdue invoice charges what the owner decides

Where a departure is recorded after the lease's agreed end date, a second invoice SHALL be issued for the days beyond the term, alongside the final invoice covering the days within it.

Its charges SHALL be decided by the owner rather than calculated. No agreement covers those days, so the system has no basis on which to decide what they cost — and prices may have changed since the lease was made.

The owner SHALL choose each charge from the building's service fees, and MAY set an amount different from the fee's current one. Choosing from the catalogue rather than typing free text keeps a charge's name consistent with every other bill, so it can still be grouped and compared.

An overdue invoice MAY carry no charges at all, for an owner who waives the extra days.

A lease SHALL have at most one overdue invoice.

#### Scenario: A late departure issues two invoices

- **WHEN** an authenticated owner records a move-out dated after the lease's expected end date
- **THEN** a final invoice covering the days within the term and an overdue invoice covering the days beyond it are both issued

#### Scenario: A departure within the term issues one invoice

- **WHEN** an authenticated owner records a move-out on or before the lease's expected end date
- **THEN** only a final invoice is issued

#### Scenario: The owner chooses what the overdue days cost

- **WHEN** an authenticated owner records a late move-out and names the charges for the days beyond the term
- **THEN** the overdue invoice carries exactly those charges, at the amounts given

#### Scenario: An overdue charge may differ from the fee's current amount

- **WHEN** an authenticated owner names a charge with an amount different from the building fee's current one
- **THEN** the overdue invoice records the amount given, because those days were never agreed at any price

#### Scenario: Waiving the overdue days

- **WHEN** an authenticated owner records a late move-out without naming any charges
- **THEN** an overdue invoice is issued carrying none, and nothing is owed for those days

#### Scenario: An overdue charge names a fee of another building

- **WHEN** an authenticated owner names a charge referring to a service fee belonging to a different building
- **THEN** the system responds with HTTP 400 and neither invoice is issued

## MODIFIED Requirements

### Requirement: Owner can generate an invoice for a lease and month
The system SHALL allow an authenticated `owner` to generate a monthly invoice for a lease and a calendar month, supplying the closing electricity meter reading for that period. The invoice SHALL record the meter readings it spans, the period it covers, its line items, and the total. Each rate and count applied — the electricity rate, the water rate, the base rent, and the occupant count — SHALL be recorded on the line item it produced, so that a charge and the figures behind it are read together.

A monthly invoice SHALL charge the utilities of the month named and the rent of the month **following** it. Rent is paid before the month it covers, so the bill settling one month's usage carries the next month's rent alongside it.

A monthly invoice SHALL only be issued where the following month falls within the lease's term. Beyond that there is no rent to charge, and the month's utilities belong on the final invoice instead.

The advance rent SHALL be prorated where the lease covers only part of that following month, which happens where a term ends partway through one.

A lease that has been finalized SHALL still be invoiceable for months it covered, because a tenancy that ended mid-month still owes a final bill.

#### Scenario: Successful generation
- **WHEN** an authenticated owner generates an invoice for a lease and month with a valid closing meter reading
- **THEN** the system creates the invoice and responds with HTTP 201, reporting the rent, electricity, water and service fee charges as line items and their total

#### Scenario: Rent is charged for the month after the one billed
- **WHEN** an authenticated owner generates a monthly invoice for January
- **THEN** its utilities cover January and its rent line covers February

#### Scenario: The last month of a term prorates the advance rent
- **WHEN** an authenticated owner generates a monthly invoice whose following month is covered by the lease only in part
- **THEN** the rent charged is reduced in proportion to the days the lease covers

#### Scenario: A month whose following month is beyond the term
- **WHEN** an authenticated owner generates a monthly invoice for a month after which the lease's term has ended
- **THEN** the system responds with HTTP 400, because there is no rent to charge and those utilities belong on the final invoice

#### Scenario: Invoicing a finalized lease
- **WHEN** an authenticated owner generates an invoice for a month covered by a lease that has already recorded a move-out
- **THEN** the system creates the invoice, because the tenancy owes a bill for the period it occupied

#### Scenario: Lease does not exist
- **WHEN** an authenticated owner generates an invoice referencing a lease id that does not exist
- **THEN** the system responds with HTTP 404 and creates no invoice

#### Scenario: Month outside the lease period
- **WHEN** an authenticated owner generates an invoice for a month during which the lease had not started or had already ended
- **THEN** the system responds with HTTP 400 and creates no invoice

### Requirement: Rent and water are prorated for a partial month
The system SHALL charge rent and water in proportion to the days of the month covered, using the actual number of days in that month. Water SHALL be the occupant count multiplied by the building's per-person water rate before proration is applied.

Water and service fees SHALL be prorated by the days of their own month the tenancy **occupied**, counted from the first day covered to the last inclusively — a tenancy covering the 16th to the 31st is sixteen days, because the tenant was there on both. The last day covered SHALL be determined by the tenancy's ending date, which is exclusive: the day before the move-out date, or the day before the expected end date where no move-out is recorded.

Rent SHALL be prorated by the days of the month it is charged **for** that the lease covers, which is a different month from the one whose utilities sit beside it. A full month within the term SHALL be charged in full; the month a tenancy begins and the month a term ends SHALL be charged for the part the lease covers.

#### Scenario: Full month is not prorated
- **WHEN** an authenticated owner generates an invoice for a month the lease occupied in full, charging rent for a month the lease covers in full
- **THEN** rent is the lease's full agreed rent and water is the full occupant count multiplied by the water rate

#### Scenario: Lease starting mid-month
- **WHEN** a lease begins partway through a month
- **THEN** its move-in invoice charges rent for the days from the start date to the end of that month, as a proportion of that month's actual length

#### Scenario: Lease ending mid-month
- **WHEN** an authenticated owner generates an invoice for the month a lease recorded its move-out
- **THEN** water and service fees are charged for the days from the start of the month up to the day before the move-out date, because that date is the first day the tenancy no longer covers

#### Scenario: A move-out on the first of a month
- **WHEN** a lease records a move-out dated the first day of a month
- **THEN** that month has no days covered and yields no invoice, because the tenancy ended before it began

#### Scenario: Lease starting and ending within one month
- **WHEN** an authenticated owner generates an invoice for a month a lease both began and ended within
- **THEN** water and service fees are charged for the days from the start date to the day before the move-out date

#### Scenario: Proration follows the month's actual length
- **WHEN** invoices are generated for equivalent partial occupancies in a 28-day month and a 31-day month
- **THEN** each is calculated against its own month's length rather than a fixed 30-day month

### Requirement: An invoice records its kind and the date it was issued

Every invoice SHALL record what kind of invoice it is, so that a bill charging a deposit and a bill charging a month's utilities are distinguishable without inspecting their charges.

The kinds SHALL be: a **move-in** invoice, issued when a tenancy begins; a **monthly** invoice, issued for a month of occupancy; a **final** invoice, issued when a tenancy ends; and an **overdue** invoice, for days beyond an agreed term.

A move-in invoice SHALL be issued by creating a lease, and a final invoice — together with an overdue one where the departure is late — by recording a move-out. Neither SHALL be issued by any other means, and the kind SHALL NOT be supplied by a caller: it is decided by the operation that issues the invoice.

Every invoice SHALL also record the date it was issued. That is when the owner billed it, which is a different fact from the period it covers: a month billed late was covered in one month and billed in another, and both need to be answerable. The issue date SHALL default to the moment the invoice is created and MAY be supplied, so a month billed late can be dated when it was actually billed.

The calendar month an invoice records SHALL continue to mean the period whose utilities it covers.

#### Scenario: An invoice reports its kind

- **WHEN** an authenticated owner retrieves an invoice
- **THEN** it reports what kind of invoice it is

#### Scenario: Generated invoices are monthly

- **WHEN** an authenticated owner generates an invoice for a lease and month
- **THEN** it is recorded as a monthly invoice

#### Scenario: The kind cannot be chosen by the caller

- **WHEN** a request to generate an invoice names a kind
- **THEN** the invoice is recorded as monthly regardless, because the kind follows from the operation

#### Scenario: An invoice reports when it was issued

- **WHEN** an authenticated owner retrieves an invoice
- **THEN** it reports the date it was issued, distinct from the period it covers

#### Scenario: The issue date defaults to now

- **WHEN** an authenticated owner generates an invoice without supplying an issue date
- **THEN** it is recorded as issued at that moment

#### Scenario: A month billed late is dated when it was billed

- **WHEN** an authenticated owner generates an invoice for an earlier month and supplies an issue date
- **THEN** the invoice records that issue date while still covering the earlier month

#### Scenario: Amounts are unaffected

- **WHEN** an authenticated owner generates an invoice
- **THEN** its rent, electricity, water, service fee charges and total are exactly what the same inputs produced before invoices recorded a kind
