## MODIFIED Requirements

### Requirement: Owner can record payment of an invoice
The system SHALL treat a new invoice as pending, and SHALL allow an authenticated `owner` to mark it paid, recording the payment method and the date it was paid. The payment date SHALL be recorded separately from the month the invoice covers, so a bill for one month paid in another is reported correctly by both measures.

The payment methods SHALL be cash, bank transfer, and **deduction from the deposit**. The last records what an owner does at a departure: settling an unpaid bill out of money already held rather than asking a tenant who has gone for more. It differs from the others in where the money came from, not in whether it arrived — the bill is genuinely collected, and the deposit held shrinks by the same amount.

A deduction exceeding the deposit held for the invoice's lease SHALL be refused and the invoice SHALL remain pending.

Marking an invoice paid SHALL take effect together with any holding it moves. An invoice recorded as paid whose deduction was not applied would report money collected twice.

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

#### Scenario: Settling an invoice from the deposit
- **WHEN** an authenticated owner marks an invoice paid by deduction from the deposit
- **THEN** the invoice reports itself as paid by that method and the lease's deposit held is reduced by the invoice's total

#### Scenario: A deduction beyond the deposit held
- **WHEN** an authenticated owner marks an invoice paid by deduction from a deposit smaller than the invoice
- **THEN** the system responds with HTTP 400 and the invoice remains pending

#### Scenario: A deduction is collected revenue
- **WHEN** an invoice is settled by deduction from the deposit
- **THEN** the revenue report counts its charges as collected rather than outstanding

#### Scenario: Invalid payment method
- **WHEN** an authenticated owner marks an invoice paid with a method that is none of cash, bank transfer or deduction from the deposit
- **THEN** the system responds with HTTP 400 and the invoice remains pending
