## MODIFIED Requirements

### Requirement: A deposit can settle what a tenancy owes

Where an invoice is paid by deduction from the deposit, the lease's holding SHALL decrease by the amount of that invoice. The money was collected months ago; this records where it went.

A deduction exceeding what the lease holds SHALL be refused, the invoice SHALL remain unpaid, and no payment SHALL be written.

An invoice settled this way SHALL count as settled in the revenue report, exactly as one settled in cash. The owner earned it and has it.

**Reversing a deduction SHALL return the amount to the holding.** The deposit was spent on a bill; undoing the payment un-spends it. A reversal that left the holding reduced would report an owner as holding less of their tenant's money than they actually do.

#### Scenario: Settling the final bill from the deposit

- **WHEN** an authenticated owner marks a final invoice of 445,000 paid by deduction from a lease holding 3,000,000
- **THEN** the invoice is paid and the lease reports a deposit held of 2,555,000

#### Scenario: A deduction beyond what is held

- **WHEN** an authenticated owner marks an invoice of 4,000,000 paid by deduction from a lease holding 3,000,000
- **THEN** the system responds with HTTP 400, the invoice remains pending, and the holding is unchanged

#### Scenario: A deducted invoice is still collected

- **WHEN** an invoice settled by deduction from the deposit falls in a reported month
- **THEN** the revenue report counts its charges as settled, not as outstanding

#### Scenario: Reversing a deduction restores the holding

- **WHEN** an authenticated owner reverses a payment of 445,000 that was deducted from a lease's deposit
- **THEN** the lease reports a deposit held of 3,000,000 again and the invoice returns to pending

#### Scenario: A holding is not restored twice

- **WHEN** an authenticated owner attempts to reverse a deduction that has already been reversed
- **THEN** the system responds with HTTP 409 and the holding is unchanged
