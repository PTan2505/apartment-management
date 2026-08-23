## ADDED Requirements

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

## MODIFIED Requirements

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
