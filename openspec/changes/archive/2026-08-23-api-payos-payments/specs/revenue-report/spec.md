## MODIFIED Requirements

### Requirement: Each month reports the money that actually arrived

The system SHALL report, for each building and month, the total **received**: the money that reached the owner during that month, taken from the dates on the payments themselves.

This is a different question from every other figure in the report, all of which are keyed on the month an invoice was issued. `settled` answers *of what I billed in March, how much has come in*; `received` answers *how much money did I take in March*. An invoice issued in March and paid in May contributes to `settled` for March and to `received` for May.

**Only payments that actually happened SHALL count.** A payment a tenant started and did not finish, one they cancelled, and one that expired are not money the owner received, and SHALL contribute nothing — in either direction, in any month. Until a gateway existed, every payment on record had happened, and this held without being stated; it does not hold on its own any more.

A deposit SHALL NOT count towards it, on the same grounds as everywhere else: it is money held rather than earned. A payment settling an invoice that charged both a deposit and revenue SHALL contribute only the revenue.

A payment that has been reversed SHALL contribute to the month it was taken and SHALL be subtracted from the month it was reversed. The money did arrive, and then it left; reporting neither would lose both facts, and reporting only the first would claim income the owner no longer has.

A payment by deduction from a deposit SHALL count as received in the month the deduction was made. The money reached the owner earlier, when the deposit was taken, but that was recorded as a holding rather than as income — this is the month it stopped being held on someone else's behalf.

Where an invoice has been paid more than once, **each succeeded payment SHALL count**. The money arrived each time, and a figure reporting what arrived has to say so; the excess is what tells an owner they owe somebody a refund.

No net figure SHALL be reported against `received`. Expenses record when they were **incurred**, not when they were paid, so subtracting them would produce a figure that is half cash and half accrual and looks like neither.

#### Scenario: Money received in the month it arrived

- **WHEN** an invoice issued in March is paid in May
- **THEN** May's received figure includes it and March's does not

#### Scenario: Received differs from settled

- **WHEN** an invoice issued in March is paid in May
- **THEN** March reports it under settled and May reports it under received

#### Scenario: A started payment is not received

- **WHEN** a tenant has started a payment and not completed it
- **THEN** no month's received figure includes it

#### Scenario: An abandoned payment is not received

- **WHEN** a payment attempt is cancelled or expires
- **THEN** no month's received figure includes it

#### Scenario: A bill paid twice is received twice

- **WHEN** an invoice is paid in cash and then again through the gateway
- **THEN** the received figure includes both, because both arrived

#### Scenario: A month with billing but no payments

- **WHEN** a month's invoices are all unpaid
- **THEN** its received figure is zero while its billed figure is not

#### Scenario: A month with payments but no billing

- **WHEN** a month contains payments of invoices issued earlier and no invoices of its own
- **THEN** its billed figure is zero and its received figure is not

#### Scenario: A deposit is not received income

- **WHEN** a move-in invoice charging a deposit and a first month's rent is paid
- **THEN** received increases by the rent alone

#### Scenario: A reversal is subtracted from the month it happened

- **WHEN** a payment taken in March is reversed in April
- **THEN** March still reports it as received and April reports it as a reduction of the same amount

#### Scenario: A deposit deduction is received when it is deducted

- **WHEN** a final invoice is settled by deduction from the deposit in May
- **THEN** May's received figure includes its charges

#### Scenario: No net figure is reported against received

- **WHEN** an authenticated owner requests a revenue report
- **THEN** the response reports received without a corresponding net figure, because expenses record when they were incurred rather than when they were paid
