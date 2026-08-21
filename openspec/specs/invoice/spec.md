## Purpose

Turns a tenancy into a monthly bill: metered electricity, per-person water, and rent for the days occupied, recorded with the rates that were applied so the bill stays a faithful record of what was charged.

## Requirements

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
