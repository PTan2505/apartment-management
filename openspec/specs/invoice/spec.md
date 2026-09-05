## Purpose

Turns a tenancy into a monthly bill: metered electricity, per-person water, and rent for the days occupied, recorded with the rates that were applied so the bill stays a faithful record of what was charged.

## Requirements

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

### Requirement: One invoice per lease per month
The system SHALL reject a second **monthly** invoice for a lease and month that already has one, so re-running billing cannot double-charge a tenant. A room MAY have more than one invoice for the same month when it was occupied by more than one lease during it, because each tenancy is billed separately.

The rule SHALL apply to monthly invoices specifically rather than to invoices generally. A lease and month may legitimately carry a monthly invoice alongside an invoice of another kind — a tenancy beginning in January has both a move-in invoice and, later, a January monthly one — and neither is a duplicate of the other.

#### Scenario: Duplicate invoice for the same lease and month
- **WHEN** an authenticated owner generates a monthly invoice for a lease and month that already has one
- **THEN** the system responds with HTTP 409 and the existing invoice is unchanged

#### Scenario: A voided invoice frees its month
- **WHEN** a monthly invoice for a lease and month has been voided and another is generated for that lease and month
- **THEN** the system creates it, because a voided invoice is retained as history rather than counted as the month's bill

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
The system SHALL treat a new invoice as pending, and SHALL allow an authenticated `owner` to mark it paid, recording the payment method and the date it was paid. Doing so SHALL write a payment record carrying those facts; the invoice itself SHALL report only whether it is paid.

The payment date SHALL be recorded separately from the month the invoice covers, so a bill for one month paid in another is reported correctly by both measures. It lives on the payment rather than the invoice because an invoice may have more than one over its life, and a column can only hold the last of them.

The payment methods SHALL be cash, bank transfer, and **deduction from the deposit**. The last records what an owner does at a departure: settling an unpaid bill out of money already held rather than asking a tenant who has gone for more. It differs from the others in where the money came from, not in whether it arrived — the bill is genuinely settled, and the deposit held shrinks by the same amount.

A deduction exceeding the deposit held for the invoice's lease SHALL be refused and the invoice SHALL remain pending.

Marking an invoice paid SHALL write the payment, the invoice's status, and any holding it moves together. An invoice recorded as paid whose payment was never written, or whose deduction was not applied, would report the same money twice or lose it entirely.

#### Scenario: New invoice is pending
- **WHEN** an authenticated owner generates an invoice
- **THEN** its payment status is pending and it carries no payment record

#### Scenario: Marking an invoice paid
- **WHEN** an authenticated owner marks a pending invoice paid with a payment method and date
- **THEN** the invoice reports itself as paid and carries a payment record with that method and date

#### Scenario: Payment date differs from the billed month
- **WHEN** an invoice covering one month is marked paid with a date in a later month
- **THEN** the invoice retains the month it covers and its payment records the date it was paid, as distinct values

#### Scenario: Marking an already paid invoice paid
- **WHEN** an authenticated owner marks an invoice paid that has already been paid
- **THEN** the system responds with HTTP 409 and the original payment is unchanged

#### Scenario: Settling an invoice from the deposit
- **WHEN** an authenticated owner marks an invoice paid by deduction from the deposit
- **THEN** the invoice reports itself as paid, its payment records that method, and the lease's deposit held is reduced by the invoice's total

#### Scenario: A deduction beyond the deposit held
- **WHEN** an authenticated owner marks an invoice paid by deduction from a deposit smaller than the invoice
- **THEN** the system responds with HTTP 400, the invoice remains pending, and no payment is written

#### Scenario: A deduction is collected revenue
- **WHEN** an invoice is settled by deduction from the deposit
- **THEN** the revenue report counts its charges as settled rather than outstanding

#### Scenario: Invalid payment method
- **WHEN** an authenticated owner marks an invoice paid with a method that is none of cash, bank transfer or deduction from the deposit
- **THEN** the system responds with HTTP 400 and the invoice remains pending

### Requirement: Owner can void an invoice and reissue it
The system SHALL allow an authenticated `owner` to void an **unpaid** invoice rather than edit it, and SHALL allow a replacement invoice to be generated for the same lease and month once the original is voided. A voided invoice SHALL be retained, and SHALL be excluded from amounts owed and settled. The system SHALL NOT allow the figures on an issued invoice to be altered in place.

Voiding an invoice that has been paid SHALL be refused. Voiding removes a bill from every total while the money paid for it stays where it is, leaving an owner holding cash against a bill that no longer exists and nothing recording that they do.

The owner SHALL reverse the payment first, which returns the invoice to pending and hands the money back. The invoice can then be voided and reissued.

**Voiding SHALL record why the bill was withdrawn, and SHALL require a reason.** A wrong meter reading, a bill issued against the wrong tenancy, and a charge the owner chose to waive are different events with different consequences, and a withdrawn bill carrying only a date cannot be explained afterwards — least of all to the tenant who asks about it. The reason is required rather than optional because an optional field on an action performed occasionally is a field that is always left empty, which is the same as not having it.

Where the system itself withdraws a bill — cancelling a tenancy voids its unpaid move-in invoice — it SHALL record its own reason in the same place. A withdrawal the system performed and one the owner performed are equally in need of explanation, and a second place to record the same fact would only compete with the first.

A reason recorded at a void SHALL NOT be alterable afterwards, for the same reason the figures on an invoice are not: it is a dated record of what happened.

Invoices voided before reasons were recorded SHALL report no reason, rather than a substituted one. Nobody knows why they were withdrawn, and inventing a uniform explanation would put a false statement in the record.

#### Scenario: Voiding an invoice
- **WHEN** an authenticated owner voids an unpaid invoice, giving a reason
- **THEN** the invoice is reported as voided with that reason, its record is retained, and it no longer counts toward amounts owed or settled

#### Scenario: Voiding without a reason

- **WHEN** an authenticated owner voids an invoice without giving a reason, or gives an empty one
- **THEN** the system responds with HTTP 400 and the invoice is unchanged

#### Scenario: The reason is reported with the invoice

- **WHEN** an authenticated owner retrieves a voided invoice
- **THEN** the response carries the reason it was withdrawn alongside the date

#### Scenario: A system-performed void records its own reason

- **WHEN** cancelling a tenancy voids its unpaid move-in invoice
- **THEN** that invoice reports a reason naming the cancellation

#### Scenario: An invoice voided before reasons were recorded

- **WHEN** an authenticated owner retrieves an invoice voided before this was introduced
- **THEN** it reports no reason, rather than a substituted one

#### Scenario: Voiding a paid invoice
- **WHEN** an authenticated owner voids an invoice that has been paid
- **THEN** the system responds with HTTP 409 and the invoice is unchanged, because voiding it would leave the money paid for it unaccounted for

#### Scenario: Voiding after reversing the payment
- **WHEN** an authenticated owner reverses the payment against a paid invoice and then voids it
- **THEN** the void succeeds, because the invoice is no longer paid

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

### Requirement: An invoice records its kind and the date it was issued

Every invoice SHALL record what kind of invoice it is, so that a bill charging a deposit and a bill charging a month's utilities are distinguishable without inspecting their charges.

The kinds SHALL be: a **move-in** invoice, issued when a tenancy begins; a **monthly** invoice, issued for a month of occupancy; a **final** invoice, issued when a tenancy ends; an **overdue** invoice, for days beyond an agreed term; and an **ad-hoc** invoice, for charges the owner decides.

A move-in invoice SHALL be issued by creating a lease, a final invoice — together with an overdue one where the departure is late — by recording a move-out, and an ad-hoc invoice by its own operation. None SHALL be issued by any other means, and the kind SHALL NOT be supplied by a caller: it is decided by the operation that issues the invoice.

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

#### Scenario: An ad-hoc invoice records its own kind

- **WHEN** an authenticated owner issues an ad-hoc invoice
- **THEN** it is recorded as ad-hoc, distinguishable from every other kind without reading its charges

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

### Requirement: An invoice carries only what its kind has

An invoice's calendar month, its period, and its meter readings SHALL be recorded only where the invoice has them. They describe a span of occupancy whose utilities were metered, which a move-in invoice does not have and an overdue invoice does not have in the same sense.

Each kind SHALL carry:

- **Move-in** — no month, no period, no meter readings. It charges a deposit and rent, neither of which is metered.
- **Monthly** — the month whose utilities it covers, that month's occupied period, and the readings spanning it.
- **Final** — the month of departure, the occupied period ending at the departure, and the readings spanning it.
- **Overdue** — the period beyond the agreed term, and no meter readings, because the closing reading was already consumed by the final invoice.
- **Ad-hoc** — no month, no period, no meter readings. Its charges are for events rather than for spans of time.

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

#### Scenario: An ad-hoc invoice reports no month and no readings

- **WHEN** an authenticated owner retrieves an ad-hoc invoice
- **THEN** it reports no calendar month, no period and no meter readings

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
### Requirement: Owner can issue an ad-hoc invoice for charges they decide

The system SHALL allow an authenticated `owner` to issue an invoice against a lease carrying charges the owner names, prices and categorises. This is for what cannot be calculated: a lost key, a room left dirty, a broken window, a penalty, a late-payment fee. Every other charge in this system follows from an agreement and a measurement; these follow from a judgement, and the system SHALL make it rather than pretend to derive it.

Each charge SHALL carry:

- a **category** from a fixed set — `damage`, `cleaning`, `lost_item`, `penalty`, `other` — so charges of a kind can be grouped and compared across tenancies;
- a **description**, free text, saying what actually happened;
- an **amount**, decided by the owner.

The categories are fixed rather than free text because "broken window" and "vỡ kính" cannot be grouped, and they are not drawn from the building's service fee catalogue because a broken window is not a service the building offers — putting it there would let a lease subscribe to one monthly.

An ad-hoc charge **SHALL be revenue**. This is what distinguishes it from a deposit line, the only charge this system excludes from what an owner earned.

A lease MAY have any number of ad-hoc invoices. A lost key in March and a broken window in July are two events, and forcing them onto one bill would misdate both.

An ad-hoc invoice SHALL carry no calendar month, no period and no meter readings, and its lines SHALL carry no period. A charge for an event has no span of time to report, and borrowing one would invent a fact.

An ad-hoc invoice SHALL carry at least one charge. An invoice for nothing records nothing.

An ad-hoc invoice MAY be issued against a lease that has recorded a move-out. Damage is usually found after the tenant has gone.

#### Scenario: Charging for a broken window

- **WHEN** an authenticated owner issues an ad-hoc invoice for a lease with one charge categorised as damage, described as a broken window, for 200,000
- **THEN** the system creates it and responds with HTTP 201, reporting that charge and a total of 200,000

#### Scenario: Several charges on one invoice

- **WHEN** an authenticated owner issues an ad-hoc invoice with a damage charge of 200,000 and a cleaning charge of 300,000
- **THEN** the invoice carries both and its total is 500,000

#### Scenario: A lease may have several ad-hoc invoices

- **WHEN** an authenticated owner issues a second ad-hoc invoice for a lease that already has one
- **THEN** both exist, each with its own issue date

#### Scenario: An ad-hoc invoice reports no period

- **WHEN** an authenticated owner retrieves an ad-hoc invoice
- **THEN** it reports no calendar month, no period and no meter readings, and none of its charges reports a period

#### Scenario: An ad-hoc charge is revenue

- **WHEN** an ad-hoc invoice charging 200,000 is issued in a month
- **THEN** that month's billed figure in the revenue report increases by 200,000

#### Scenario: Charging a departed tenant

- **WHEN** an authenticated owner issues an ad-hoc invoice for a lease that has recorded a move-out
- **THEN** the system creates it, because damage is usually found after the tenant has gone

#### Scenario: An invoice with no charges

- **WHEN** an authenticated owner issues an ad-hoc invoice naming no charges
- **THEN** the system responds with HTTP 400 and creates nothing

#### Scenario: An unrecognised category

- **WHEN** an authenticated owner issues an ad-hoc invoice with a charge whose category is not one of the fixed set
- **THEN** the system responds with HTTP 400 and creates nothing

#### Scenario: A negative charge

- **WHEN** an authenticated owner issues an ad-hoc invoice with a charge of a negative amount
- **THEN** the system responds with HTTP 400 and creates nothing

#### Scenario: A lease that does not exist

- **WHEN** an authenticated owner issues an ad-hoc invoice for a lease id that does not exist
- **THEN** the system responds with HTTP 404 and creates nothing

#### Scenario: Settling an ad-hoc invoice from the deposit

- **WHEN** an authenticated owner marks an ad-hoc invoice paid by deduction from the deposit
- **THEN** it is paid like any other invoice and the lease's deposit held is reduced by its total

#### Scenario: Issuing requires an authenticated owner

- **WHEN** an ad-hoc invoice is issued without an access token whose role is `owner`
- **THEN** the system responds with HTTP 401 or 403 and creates nothing

### Requirement: The system reports which tenancies are due to be billed for a month

The system SHALL report, for a given month, every tenancy that can be issued a monthly invoice for it and has not been, together with the electricity reading each would open from.

A caller cannot work this out cheaply, and should not have to work it out at all. Answering it means taking the tenancies that occupied the room during that month, subtracting those already holding a non-voided invoice for it, excluding those with no rent left to charge within their term, and then resolving one opening reading per tenancy — which in a client is a request per room and a second copy of a rule this system already owns. Two copies of a billing rule is one that will eventually disagree with the invoices it produced.

Its purpose is answering **"which rooms have I not billed yet"**, so what it reports SHALL be exactly the work outstanding: a tenancy SHALL leave the result as soon as its invoice for that month exists, and SHALL NOT appear where issuing one would be refused.

The opening reading SHALL be the same figure the invoice would actually open from — the closing reading of that tenancy's most recent metered non-voided invoice, or the reading the tenancy itself started from where it has none. A figure that merely resembles it would let a caller present a plausible wrong number for a person to check their typing against.

The result SHALL identify each tenancy's room and building, so it can be read without a further request per row, and SHALL be narrowable by building — an owner closing off a month works through one building at a time.

#### Scenario: What is outstanding for a month

- **WHEN** an authenticated owner asks what is due to be billed for a month
- **THEN** the system reports every tenancy that occupied a room in that month and has no non-voided invoice for it, each with its room, its building, and the reading it would open from

#### Scenario: An already billed tenancy is not reported

- **WHEN** a tenancy holds a non-voided monthly invoice for that month
- **THEN** it is not reported as due

#### Scenario: A voided invoice leaves the work outstanding

- **WHEN** a tenancy's only invoice for that month has been voided
- **THEN** it is reported as due again, because the bill it had was withdrawn

#### Scenario: A tenancy with no rent left in its term

- **WHEN** a tenancy occupied the month but its term reaches no further, so that its remaining utilities belong on a final invoice
- **THEN** it is not reported as due, because issuing a monthly invoice for it would be refused

#### Scenario: A tenancy that did not occupy the month

- **WHEN** a tenancy began after that month ended, or ended before it began
- **THEN** it is not reported as due

#### Scenario: A cancelled tenancy is never due

- **WHEN** a tenancy has been cancelled
- **THEN** it is not reported as due for any month, because it occupied none

#### Scenario: The opening reading matches what the invoice would use

- **WHEN** a tenancy has already been billed for earlier months
- **THEN** the reading reported is the closing reading of its most recent metered non-voided invoice

#### Scenario: A tenancy that has never been metered

- **WHEN** a tenancy has no invoice carrying a meter reading
- **THEN** the reading reported is the one the tenancy itself started from

#### Scenario: Narrowed to one building

- **WHEN** an authenticated owner asks what is due for a month within a named building
- **THEN** only tenancies in that building are reported

#### Scenario: Nothing outstanding

- **WHEN** every tenancy that occupied that month has been billed for it
- **THEN** the system reports that nothing is due, rather than an error

#### Scenario: Requires an authenticated owner

- **WHEN** an unauthenticated request asks what is due to be billed
- **THEN** the system responds with HTTP 401

### Requirement: The due report carries the rate each reading will be charged at

The report of what is due to be billed SHALL include, per tenancy, the electricity rate its invoice would apply.

It is there for the same reason the opening reading is there. A meter reading means nothing alone — what is billed is the difference, multiplied by a rate — and a caller showing an owner a number to check has only half of it without the multiplier. An owner who can see `160 kWh × 3.800` can tell a plausible figure from a wrong one before the invoice exists; one who sees `160 kWh` cannot.

The rate SHALL be the one the invoice would actually apply, resolved the same way, so that what the owner is shown before issuing and what the invoice records afterwards cannot disagree.

The alternative — a caller fetching each building to assemble it — is a request per row for a figure this report already holds, and a second copy of the rule that decides which rate applies.

#### Scenario: The rate accompanies the reading

- **WHEN** an authenticated owner asks what is due to be billed for a month
- **THEN** each tenancy reported carries the electricity rate its invoice would apply, alongside the reading it would open from

#### Scenario: The rate shown is the rate charged

- **WHEN** an invoice is issued for a tenancy that appeared in the report
- **THEN** the rate the invoice records is the one the report gave for it
