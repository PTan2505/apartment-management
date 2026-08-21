## ADDED Requirements

### Requirement: An invoice records its kind and the date it was issued

Every invoice SHALL record what kind of invoice it is, so that a bill charging a deposit and a bill charging a month's utilities are distinguishable without inspecting their charges.

The kinds SHALL be: a **move-in** invoice, issued when a tenancy begins; a **monthly** invoice, issued for a month of occupancy; a **final** invoice, issued when a tenancy ends; and an **overdue** invoice, for days beyond an agreed term. Only monthly invoices SHALL be issued until the kinds that produce the others exist.

Every invoice SHALL also record the date it was issued. That is when the owner billed it, which is a different fact from the period it covers: a month billed late was covered in one month and billed in another, and both need to be answerable. The issue date SHALL default to the moment the invoice is created and MAY be supplied, so a month billed late can be dated when it was actually billed.

The calendar month an invoice records SHALL continue to mean the period whose utilities it covers.

#### Scenario: An invoice reports its kind

- **WHEN** an authenticated owner retrieves an invoice
- **THEN** it reports what kind of invoice it is

#### Scenario: Generated invoices are monthly

- **WHEN** an authenticated owner generates an invoice for a lease and month
- **THEN** it is recorded as a monthly invoice

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

## MODIFIED Requirements

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
