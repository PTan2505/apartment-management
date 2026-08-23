## Purpose

Records what settles an invoice as an event in its own right — its amount, method, date and status — so that money arriving can be told apart from money billed, a settlement can be undone, and a payment that has been started but not finished has somewhere to exist.

## Requirements

### Requirement: A payment is recorded as its own event

The system SHALL record each payment against an invoice as a record of its own, carrying the amount paid, the method, the date the money moved, and a status.

An invoice MAY have more than one payment record over its life. A payment taken, reversed, and taken again is three facts about what happened, and overwriting a column would keep only the last of them.

A payment SHALL record the moment the money moved, which is distinct from the date the invoice was issued and from the month it covers. All three are separately answerable and none substitutes for another.

**That date SHALL be absent where no money has moved.** A payment a tenant has started and not completed has no such moment, and recording one would be a fiction that every figure keyed on it then reports as fact.

The methods SHALL be cash, bank transfer, deduction from the deposit, and payment through the gateway.

#### Scenario: Paying an invoice records a payment

- **WHEN** an authenticated owner marks an invoice paid with a method and a date
- **THEN** a payment record exists against that invoice carrying the invoice's total, that method, and that date

#### Scenario: A payment records when the money moved

- **WHEN** an invoice issued in March is paid in May
- **THEN** the payment is dated May while the invoice remains issued in March

#### Scenario: A payment that has not happened has no date

- **WHEN** a tenant starts a payment through the gateway and has not completed it
- **THEN** the payment record carries no date, because no money has moved

#### Scenario: The date is set when the money arrives

- **WHEN** that payment is confirmed
- **THEN** it carries the date the gateway reported the money moving

#### Scenario: An invoice may carry several payments over its life

- **WHEN** an invoice is paid, the payment is reversed, and the invoice is paid again
- **THEN** the invoice carries records of all of it, rather than only the latest

### Requirement: A payment carries a status

Every payment SHALL record what state it is in, so that a payment which has been started but not finished has somewhere to exist.

The states SHALL be: **pending**, while a tenant has started a payment and not completed it; **succeeded**, where the money arrived; **cancelled** and **expired**, where the attempt ended without it; and **reversed**, where it arrived and was given back.

A payment recorded by an owner SHALL be succeeded from the moment it is written: an owner marking an invoice paid is reporting money already in hand, and there is nothing to wait for.

Only a succeeded payment SHALL settle an invoice or move a deposit holding. A payment in any other state SHALL leave both untouched.

A payment SHALL move out of `pending` only once. An attempt that has already succeeded, been cancelled or expired SHALL NOT be reopened; a further attempt is a further payment record.

#### Scenario: An owner-recorded payment succeeds immediately

- **WHEN** an authenticated owner marks an invoice paid
- **THEN** the payment is recorded as succeeded and the invoice is paid

#### Scenario: A payment that has not succeeded settles nothing

- **WHEN** a payment against an invoice is in any status other than succeeded
- **THEN** the invoice remains pending and no deposit holding has moved

#### Scenario: A started payment waits

- **WHEN** a tenant starts a payment through the gateway
- **THEN** the payment is pending, the invoice is still unpaid, and nothing has been received

#### Scenario: An abandoned payment settles nothing

- **WHEN** a payment attempt is cancelled or expires
- **THEN** the invoice remains unpaid and the attempt is kept as a record of what happened

#### Scenario: A settled attempt is not reopened

- **WHEN** the gateway reports on an attempt that has already succeeded, been cancelled, or expired
- **THEN** its state is unchanged

### Requirement: An invoice reports whether it is paid

An invoice SHALL continue to report its payment status directly, and that status SHALL be written in the same transaction as the payment that changes it. An invoice recorded as paid whose payment was never written, or the reverse, would report money twice or lose it.

The status SHALL be `paid` where **at least one** succeeded, unreversed payment exists against the invoice, and `pending` otherwise.

**More than one is possible and is not an error.** Where an owner has taken cash for a bill and the tenant's transfer then succeeds, the money arrived twice; refusing the second would leave it in the bank and absent from the record. Both are kept, the excess is visible in what the invoice has been paid, and the owner returns it by reversing one.

#### Scenario: The status follows the payment

- **WHEN** a succeeded payment is recorded against a pending invoice
- **THEN** the invoice reports itself as paid

#### Scenario: The status follows a reversal

- **WHEN** the only succeeded payment against a paid invoice is reversed
- **THEN** the invoice reports itself as pending again

#### Scenario: An invoice paid twice keeps both payments

- **WHEN** an invoice already paid in cash receives a successful gateway payment
- **THEN** both payments are recorded, the invoice remains paid, and the total paid exceeds the total owed

#### Scenario: Reversing one of two leaves the invoice paid

- **WHEN** one of two succeeded payments against an invoice is reversed
- **THEN** the invoice still reports itself as paid, because one succeeded payment remains

#### Scenario: Filtering by payment status still works

- **WHEN** an authenticated owner lists invoices filtered to pending ones
- **THEN** the response contains only invoices with no succeeded payment against them

### Requirement: Owner can reverse a payment

The system SHALL allow an authenticated `owner` to reverse a succeeded payment, recording when it was reversed. Reversing SHALL return the invoice to pending, and SHALL restore a deposit holding where the payment was a deduction from one.

This exists because voiding a paid invoice is refused. An owner who issued an invoice for the wrong amount and was paid for it must be able to undo the payment, void the invoice, and issue the right one — and closing the first route without opening this one would leave them stuck.

A reversal SHALL be recorded rather than deleting the payment. The money moved and then moved back; both happened.

A payment that has already been reversed SHALL NOT be reversed again.

#### Scenario: Reversing a cash payment

- **WHEN** an authenticated owner reverses a succeeded cash payment
- **THEN** the payment is recorded as reversed with the date, and the invoice reports itself as pending

#### Scenario: Reversing a deposit deduction restores the holding

- **WHEN** an authenticated owner reverses a payment of 200,000 that was deducted from a lease's deposit
- **THEN** the lease's deposit held increases by 200,000 and the invoice reports itself as pending

#### Scenario: The reversal is recorded, not erased

- **WHEN** a payment has been reversed
- **THEN** the payment record still exists, reporting both when it was taken and when it was reversed

#### Scenario: Reversing twice

- **WHEN** an authenticated owner reverses a payment that has already been reversed
- **THEN** the system responds with HTTP 409 and nothing changes

#### Scenario: The invoice can then be voided

- **WHEN** an authenticated owner reverses the only payment against an invoice and then voids that invoice
- **THEN** both succeed, because the invoice is no longer paid

### Requirement: Payment endpoints require an authenticated owner

Every payment endpoint SHALL require a valid access token belonging to a user with the `owner` role.

#### Scenario: Request without a token

- **WHEN** a payment endpoint is called without an access token
- **THEN** the system responds with HTTP 401

#### Scenario: Request with a non-owner token

- **WHEN** a payment endpoint is called with a token whose role is not `owner`
- **THEN** the system responds with HTTP 403
