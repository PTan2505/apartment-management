## MODIFIED Requirements

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

#### Scenario: Voiding an invoice
- **WHEN** an authenticated owner voids an unpaid invoice
- **THEN** the invoice is reported as voided, its record is retained, and it no longer counts toward amounts owed or settled

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
