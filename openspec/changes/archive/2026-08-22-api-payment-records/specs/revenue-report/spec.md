## ADDED Requirements

### Requirement: Each month reports the money that actually arrived

The system SHALL report, for each building and month, the total **received**: the money that reached the owner during that month, taken from the dates on the payments themselves.

This is a different question from every other figure in the report, all of which are keyed on the month an invoice was issued. `settled` answers *of what I billed in March, how much has come in*; `received` answers *how much money did I take in March*. An invoice issued in March and paid in May contributes to `settled` for March and to `received` for May.

A deposit SHALL NOT count towards it, on the same grounds as everywhere else: it is money held rather than earned. A payment settling an invoice that charged both a deposit and revenue SHALL contribute only the revenue.

A payment that has been reversed SHALL contribute to the month it was taken and SHALL be subtracted from the month it was reversed. The money did arrive, and then it left; reporting neither would lose both facts, and reporting only the first would claim income the owner no longer has.

A payment by deduction from a deposit SHALL count as received in the month the deduction was made. The money reached the owner earlier, when the deposit was taken, but that was recorded as a holding rather than as income — this is the month it stopped being held on someone else's behalf.

No net figure SHALL be reported against `received`. Expenses record when they were **incurred**, not when they were paid, so subtracting them would produce a figure that is half cash and half accrual and looks like neither.

#### Scenario: Money received in the month it arrived

- **WHEN** an invoice issued in March is paid in May
- **THEN** May's received figure includes it and March's does not

#### Scenario: Received differs from settled

- **WHEN** an invoice issued in March is paid in May
- **THEN** March reports it under settled and May reports it under received

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

## MODIFIED Requirements

### Requirement: Each month reports billed, collected, outstanding, expenses, and both net figures
The system SHALL report, for each building and month: the total billed, the total **settled**, the total outstanding, the total expenses incurred, and two net figures — billed less expenses, and settled less expenses. Because an invoice is paid in full or not at all, `billed` SHALL equal `settled` plus `outstanding` exactly.

The figure formerly called `collected` SHALL be named `settled`, and the net figure derived from it `netSettled`. Neither changes what it counts. The name does: `collected` reads as money received, and this figure is keyed on the month an invoice was **issued**, so an invoice issued in March and paid in May counts toward March. Beside a figure that genuinely reports money received, the old name would mislead every reader from here on.

A deposit SHALL NOT count towards any of these figures. It is money held on a tenant's behalf rather than earned, so counting it would inflate the month a tenant arrives and leave a hole in the month it is returned — reporting an owner as having earned money they may owe back.

A charge the owner named on an ad-hoc invoice SHALL count towards them in full. It is money earned: a tenant who broke a window owes for it, and the owner who repairs it records that cost separately as an expense. Excluding the charge while counting the repair would report a loss on damage the tenant paid for.

These figures SHALL therefore be built from the charges on an invoice rather than from its recorded total, since an invoice charging both a deposit and rent has a total larger than the revenue it represents. An invoice charging a deposit alone SHALL contribute nothing.

#### Scenario: Billed splits exactly into collected and outstanding
- **WHEN** a month contains both paid and unpaid invoices
- **THEN** settled is the sum of the paid ones, outstanding is the sum of the unpaid ones, and the two add up to billed

#### Scenario: A deposit is not counted as revenue
- **WHEN** a month contains a move-in invoice charging a deposit and a first month's rent
- **THEN** billed includes the rent and excludes the deposit

#### Scenario: An owner-named charge is counted as revenue
- **WHEN** a month contains an ad-hoc invoice charging 200,000 for damage
- **THEN** billed includes the whole 200,000

#### Scenario: A charge settled from the deposit is still collected
- **WHEN** an ad-hoc invoice is marked paid by deduction from the deposit
- **THEN** settled includes its charges, because the money reached the owner when the deposit was taken

#### Scenario: Paying a move-in invoice collects only its revenue
- **WHEN** a move-in invoice charging a deposit and rent is recorded as paid
- **THEN** settled increases by the rent alone

#### Scenario: An invoice's total may exceed what it contributes
- **WHEN** an invoice charges both a deposit and revenue
- **THEN** the figure it contributes to the report is less than its recorded total, and the invoice's own total is unchanged

#### Scenario: A month where everything is paid
- **WHEN** every invoice for a month has been paid
- **THEN** settled equals billed and outstanding is zero

#### Scenario: A month where nothing is paid
- **WHEN** no invoice for a month has been paid
- **THEN** outstanding equals billed and settled is zero

#### Scenario: Both net figures are reported
- **WHEN** a month has billed and settled amounts and recorded expenses
- **THEN** the response reports one net figure of billed less expenses and another of settled less expenses

#### Scenario: Net figures may be negative
- **WHEN** a month's expenses exceed what was settled
- **THEN** the settled-based net figure is reported as a negative amount rather than clamped to zero

### Requirement: Billing figures are keyed on the month billed
The system SHALL attribute every invoice to the month it was **issued** rather than the date it was paid, so that a month's figures remain comparable to other months instead of changing as late payments arrive. Voided invoices SHALL be excluded from every figure.

The month issued is used rather than the month covered because not every invoice covers one. A move-in invoice charges a deposit and rent and has no month of metered occupancy at all, so there is no month it could be attributed to. Issuing is the one thing every invoice has.

It also answers the question an owner asks of this report — what did I bill out in March — for a bill that settles February's utilities alongside March's rent, and belongs wholly to neither.

The `received` figure is the deliberate exception: it is keyed on the date of the payment, because it exists to answer the question the issue-month keying cannot.

#### Scenario: An invoice paid in a later month
- **WHEN** an invoice is paid during a month later than the one it was issued in
- **THEN** it counts toward the month it was issued in both the billed and settled figures, and toward the month it was paid in the received figure

#### Scenario: A move-in invoice is attributed to the month it was issued
- **WHEN** a move-in invoice, which covers no month of occupancy, is included in the report
- **THEN** it counts toward the month it was issued

#### Scenario: A month billed late counts where it was billed
- **WHEN** an invoice covering an earlier month is issued with a later issue date
- **THEN** it counts toward the month of that issue date rather than the month it covers

#### Scenario: Voided invoices are excluded
- **WHEN** an invoice has been voided
- **THEN** it contributes to no figure in the report
