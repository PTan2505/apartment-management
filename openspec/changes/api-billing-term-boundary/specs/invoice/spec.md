## ADDED Requirements

### Requirement: A lease with no recorded move-out is billable only within its term

Where a lease has recorded no move-out, its agreed term SHALL bound what may be billed. A month falling entirely beyond the expected end date SHALL be refused, and a month the term ends partway through SHALL be charged only for the days the term covers.

A lease with no move-out SHALL NOT be treated as running indefinitely. An unrecorded departure is a missing record, not an open-ended agreement: nobody has confirmed the tenant is still there, so charging beyond the term bills time that was neither agreed nor established.

An owner reaching the end of a term SHALL therefore have to record the departure or create a new lease before billing can continue. A tenant remaining in a room under a renewed agreement is represented by a new lease, each lease billed for its own term.

Where a move-out **has** been recorded, that date SHALL bound the billable period as it already does, including when it falls after the expected end date. The dates are then a recorded fact rather than an assumption, and what is charged for days beyond the term is decided elsewhere rather than refused here.

#### Scenario: A month beyond the term is refused on an unclosed lease

- **WHEN** an authenticated owner generates an invoice for a month falling entirely after the expected end date of a lease with no move-out recorded
- **THEN** the system responds with HTTP 400 and creates no invoice

#### Scenario: A month long after the term is refused

- **WHEN** an authenticated owner generates an invoice for a month many months beyond the term of a lease with no move-out recorded
- **THEN** the system responds with HTTP 400 and creates no invoice

#### Scenario: A month before the lease began is refused

- **WHEN** an authenticated owner generates an invoice for a month falling entirely before the lease's start date
- **THEN** the system responds with HTTP 400 and creates no invoice

#### Scenario: The final month of an unclosed lease is billed to the term end

- **WHEN** an authenticated owner generates an invoice for the month the term of a lease with no move-out ends partway through
- **THEN** the charges cover the days from the start of that month up to the last day the term covers, rather than the whole month

#### Scenario: The last covered day is the day before the expected end date

- **WHEN** a lease begins 2026-01-01 for six months with no move-out recorded, and an invoice is generated for June 2026
- **THEN** the period billed ends on 2026-06-30, and no day of July is charged

#### Scenario: A full month within the term is charged in full

- **WHEN** an authenticated owner generates an invoice for a month lying wholly inside the term
- **THEN** the charges are not reduced

#### Scenario: A recorded move-out before the term end bounds the period

- **WHEN** a lease recorded a move-out earlier than its expected end date and an invoice is generated for that month
- **THEN** the charges cover the days up to the move-out date, which is earlier than the term end

#### Scenario: A recorded move-out after the term end is not refused

- **WHEN** a lease recorded a move-out after its expected end date, and an invoice is generated for the month that move-out falls in
- **THEN** the system does not refuse the month, because the occupancy is a recorded fact rather than an assumption

#### Scenario: A renewal is billed separately from the lease it follows

- **WHEN** a tenant continues in the same room under a new lease beginning on the previous lease's expected end date
- **THEN** each lease is billed for its own term, and no day is billed twice or left unbilled

## MODIFIED Requirements

### Requirement: Rent and water are prorated for a partial month
The system SHALL charge rent and water in proportion to the days of the month the lease was occupied, using the actual number of days in that month. A lease covering the whole month SHALL be charged in full without proration. Water SHALL be the occupant count multiplied by the building's per-person water rate before proration is applied.

The days occupied SHALL run from the first day the tenancy covers to the last, counted inclusively — a tenancy covering the 16th to the 31st is sixteen days, because the tenant was there on both. The last day covered SHALL be determined by the tenancy's ending date, which is exclusive: the day before the move-out date, or the day before the expected end date where no move-out is recorded.

#### Scenario: Full month is not prorated
- **WHEN** an authenticated owner generates an invoice for a month the lease occupied in full
- **THEN** rent is the lease's full agreed rent and water is the full occupant count multiplied by the water rate

#### Scenario: Lease starting mid-month
- **WHEN** an authenticated owner generates an invoice for the month a lease began partway through
- **THEN** rent and water are charged for the days from the start date to the end of the month, as a proportion of that month's actual length

#### Scenario: Lease ending mid-month
- **WHEN** an authenticated owner generates an invoice for the month a lease recorded its move-out
- **THEN** rent and water are charged for the days from the start of the month up to the day before the move-out date, because that date is the first day the tenancy no longer covers

#### Scenario: A move-out on the first of a month
- **WHEN** a lease records a move-out dated the first day of a month
- **THEN** that month has no days covered and yields no invoice, because the tenancy ended before it began

#### Scenario: Lease starting and ending within one month
- **WHEN** an authenticated owner generates an invoice for a month a lease both began and ended within
- **THEN** rent and water are charged for the days from the start date to the day before the move-out date

#### Scenario: Proration follows the month's actual length
- **WHEN** invoices are generated for equivalent partial occupancies in a 28-day month and a 31-day month
- **THEN** each is calculated against its own month's length rather than a fixed 30-day month
