## MODIFIED Requirements

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
