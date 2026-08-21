## Purpose

Tracks the money an owner holds on a tenant's behalf: how a deposit comes to be held, how it moves to a renewal, how it settles what a departing tenancy owes, how it is returned, and how much of it is held right now. It is the one part of the system whose figures are never earnings.

## ADDED Requirements

### Requirement: A lease records the deposit it is holding

The system SHALL record, per lease, the amount of deposit currently held for it, in currency. This SHALL be distinct from the deposit its terms agreed, which is derived from the agreed rent and the number of deposit months.

The two SHALL be allowed to differ, because they answer different questions. What the terms agreed is what the tenancy asked for; what is held is what the owner actually has. A deposit carried over from a previous tenancy, a move-in invoice not yet paid, and a rent raised at renewal each make them differ.

A lease SHALL report both, and SHALL report the difference between them: positive where the holding falls short of what the terms require, negative where it exceeds them. Reporting the difference rather than leaving it to be computed is the point — a shortfall nobody subtracted is a shortfall nobody noticed.

A lease that has never held a deposit SHALL report a holding of zero, not an absence.

#### Scenario: A lease reports what it holds and what it agreed

- **WHEN** an authenticated owner retrieves a lease with an agreed rent of 3,000,000 and a one-month deposit, holding 3,000,000
- **THEN** it reports a deposit required of 3,000,000, a deposit held of 3,000,000, and a difference of zero

#### Scenario: A holding short of the terms is reported as short

- **WHEN** a lease requires a deposit of 3,500,000 and holds 3,000,000
- **THEN** it reports a shortfall of 500,000

#### Scenario: A holding beyond the terms is reported as surplus

- **WHEN** a lease requires a deposit of 2,500,000 and holds 3,000,000
- **THEN** it reports a difference of −500,000

#### Scenario: A lease holding nothing reports zero

- **WHEN** an authenticated owner retrieves a lease whose move-in invoice has not been paid
- **THEN** it reports a deposit held of zero

### Requirement: A deposit becomes held when the invoice charging it is paid

The system SHALL begin holding a deposit when the invoice carrying its charge is marked paid, and not when that invoice is issued. An owner who has billed a deposit and not been paid is holding nothing, and SHALL NOT be reported as holding it.

The amount held SHALL be the amount charged on that invoice, not the amount recomputed from the lease's terms. The charge is what the tenant actually paid.

Voiding an invoice that established a holding SHALL remove that holding, because the charge it rested on no longer stands.

#### Scenario: Billing a deposit does not make it held

- **WHEN** an authenticated owner creates a lease and its move-in invoice is issued but not paid
- **THEN** the lease reports a deposit held of zero

#### Scenario: Paying the move-in invoice establishes the holding

- **WHEN** an authenticated owner marks paid a move-in invoice charging a deposit of 3,000,000
- **THEN** the lease reports a deposit held of 3,000,000

#### Scenario: An invoice with no deposit line establishes no holding

- **WHEN** an authenticated owner marks paid a monthly invoice
- **THEN** the lease's deposit held is unchanged

#### Scenario: Voiding the invoice removes the holding

- **WHEN** an authenticated owner voids a paid move-in invoice that established a holding
- **THEN** the lease no longer reports that deposit as held

### Requirement: A deposit moves to the successor when a lease is extended

Where a lease is extended, the deposit held for it SHALL move to the successor lease rather than being returned and charged again. The predecessor SHALL record that its holding left by transfer, and the successor SHALL record the amount it received.

The total held across the two leases SHALL be unchanged by the transfer itself. No money moved; only which tenancy it is held against.

The successor's move-in invoice SHALL charge only the **difference** between the deposit its terms require and the deposit carried in, where the owner elects to settle that difference on the invoice. A difference of zero SHALL produce no deposit line at all.

Where the owner elects not to settle it on the invoice, the successor SHALL carry the difference as a reported shortfall or surplus until it is recorded separately.

#### Scenario: The deposit is not charged twice

- **WHEN** an authenticated owner extends a lease holding a deposit of 3,000,000 into a successor whose terms require 3,000,000
- **THEN** the successor's move-in invoice charges rent alone, with no deposit line

#### Scenario: The transfer moves no money

- **WHEN** a deposit of 3,000,000 is carried from a lease to its successor
- **THEN** the predecessor reports holding nothing, the successor reports holding 3,000,000, and the total held is unchanged

#### Scenario: A raised rent is topped up on the invoice

- **WHEN** an authenticated owner extends a lease holding 3,000,000 into a successor requiring 3,500,000, electing to settle on the invoice
- **THEN** the successor's move-in invoice charges a deposit of 500,000 alongside the first month's rent

#### Scenario: A lowered rent returns the surplus on the invoice

- **WHEN** an authenticated owner extends a lease holding 3,000,000 into a successor requiring 2,500,000, electing to settle on the invoice
- **THEN** the successor's move-in invoice reduces what is owed by 500,000

#### Scenario: A difference left unsettled is reported

- **WHEN** an authenticated owner extends a lease holding 3,000,000 into a successor requiring 3,500,000, electing not to settle on the invoice
- **THEN** the successor's move-in invoice charges rent alone and the successor reports a shortfall of 500,000

#### Scenario: The top-up becomes held when it is paid

- **WHEN** the successor's move-in invoice charging a 500,000 deposit top-up is marked paid
- **THEN** the successor reports a deposit held of 3,500,000 and no shortfall

### Requirement: Owner can record a deposit movement outside an invoice

The system SHALL allow an authenticated `owner` to record an amount added to or taken from a lease's holding without an invoice, naming a reason. A top-up collected in cash at a renewal and a surplus handed back across a desk both happen, and a holding that does not record them is wrong.

An amount added SHALL increase the holding; an amount taken SHALL decrease it. A movement that would take the holding below zero SHALL be refused, because an owner cannot return money they are not holding.

Such a movement SHALL NOT appear as revenue and SHALL NOT appear as an expense.

#### Scenario: A top-up collected in cash

- **WHEN** an authenticated owner records 500,000 added to a lease holding 3,000,000
- **THEN** the lease reports a deposit held of 3,500,000

#### Scenario: A surplus handed back in cash

- **WHEN** an authenticated owner records 500,000 taken from a lease holding 3,000,000
- **THEN** the lease reports a deposit held of 2,500,000

#### Scenario: A movement beyond what is held

- **WHEN** an authenticated owner records 4,000,000 taken from a lease holding 3,000,000
- **THEN** the system responds with HTTP 400 and the holding is unchanged

#### Scenario: A movement is not earnings

- **WHEN** a deposit movement is recorded in a month
- **THEN** the revenue report for that month reports the same billed, collected and expense figures as before it

### Requirement: A deposit can settle what a tenancy owes

Where an invoice is marked paid by deduction from the deposit, the lease's holding SHALL decrease by the amount of that invoice. The money was collected months ago; this records where it went.

A deduction exceeding what the lease holds SHALL be refused, and the invoice SHALL remain unpaid. An owner cannot spend a deposit they do not have.

An invoice settled this way SHALL count as collected in the revenue report, exactly as one settled in cash. The owner earned it and has it.

#### Scenario: Settling the final bill from the deposit

- **WHEN** an authenticated owner marks a final invoice of 445,000 paid by deduction from a lease holding 3,000,000
- **THEN** the invoice is paid and the lease reports a deposit held of 2,555,000

#### Scenario: A deduction beyond what is held

- **WHEN** an authenticated owner marks an invoice of 4,000,000 paid by deduction from a lease holding 3,000,000
- **THEN** the system responds with HTTP 400, the invoice remains pending, and the holding is unchanged

#### Scenario: A deducted invoice is still collected

- **WHEN** an invoice settled by deduction from the deposit falls in a reported month
- **THEN** the revenue report counts its charges as collected, not as outstanding

### Requirement: Owner can return a deposit and close the holding

The system SHALL allow an authenticated `owner` to record the amount returned to a departing tenant, together with a reason where it differs from what was held. Recording the return SHALL close the holding: the lease SHALL afterwards report holding nothing.

The returned amount SHALL be decided by the owner, not computed. The system SHALL report the arithmetic it knows — what is held, what has already been deducted, what remains — and SHALL NOT decide the final figure. Damage to a room is not something it can know, and inventing a number the owner did not choose would be worse than asking for one.

A return SHALL be recorded only for a lease that has recorded a move-out. A tenancy still running has not finished with its deposit.

A return SHALL NOT exceed what is held, and SHALL be recordable only once per lease.

A return SHALL NOT appear as an expense and SHALL NOT reduce net profit in any month. Handing back money that was never earned is not a cost.

#### Scenario: Returning the whole deposit

- **WHEN** an authenticated owner records a return of 3,000,000 for a finalized lease holding 3,000,000
- **THEN** the lease reports the return, reports holding nothing, and the return is dated

#### Scenario: Returning less than was held, with a reason

- **WHEN** an authenticated owner records a return of 2,800,000 for a lease holding 3,000,000, noting a broken window
- **THEN** the lease records both the amount and the reason, and reports holding nothing

#### Scenario: The owner decides the figure

- **WHEN** an authenticated owner requests the settlement figures for a departing lease
- **THEN** the system reports what is held and what has been deducted, and does not propose an amount to return

#### Scenario: Returning a deposit on a running tenancy

- **WHEN** an authenticated owner records a return for a lease with no move-out date
- **THEN** the system responds with HTTP 409 and nothing is recorded

#### Scenario: Returning more than is held

- **WHEN** an authenticated owner records a return of 4,000,000 for a lease holding 3,000,000
- **THEN** the system responds with HTTP 400 and nothing is recorded

#### Scenario: Returning twice

- **WHEN** an authenticated owner records a return for a lease whose deposit has already been returned
- **THEN** the system responds with HTTP 409 and the original return is unchanged

#### Scenario: A return is not an expense

- **WHEN** a deposit is returned in a month
- **THEN** that month's expenses and net figures in the revenue report are unchanged by it

### Requirement: Owner can see what is currently held

The system SHALL allow an authenticated `owner` to retrieve the deposits currently held: each holding with the lease, room and tenant it belongs to, and the total. The selection SHALL be filterable by building.

Only open holdings SHALL be included. A deposit returned, or carried to a successor, is no longer held and SHALL NOT be counted.

This SHALL be reported separately from the revenue report. Every figure there is a flow through a month; a holding is a balance at a moment, and placing one among the others invites "deposits held in March" to be read as something that happened in March.

#### Scenario: Listing what is held

- **WHEN** an authenticated owner retrieves the deposits held
- **THEN** each entry reports its lease, room, tenant and amount, and the response reports their total

#### Scenario: Filtering by building

- **WHEN** an authenticated owner retrieves the deposits held for one building
- **THEN** only holdings against leases in that building are reported, and the total covers those alone

#### Scenario: Returned deposits are not held

- **WHEN** a deposit has been returned to its tenant
- **THEN** it is absent from the deposits held and excluded from the total

#### Scenario: Carried deposits are counted once

- **WHEN** a deposit has been carried from a lease to its successor
- **THEN** it is reported against the successor alone, and the total is unchanged by the transfer

#### Scenario: Nothing held reports zero

- **WHEN** an authenticated owner retrieves the deposits held for a building with no active tenancies
- **THEN** the response reports no entries and a total of zero

### Requirement: Deposit endpoints require an authenticated owner

Every deposit endpoint SHALL require a valid access token belonging to a user with the `owner` role.

#### Scenario: Request without a token

- **WHEN** a deposit endpoint is called without an access token
- **THEN** the system responds with HTTP 401

#### Scenario: Request with a non-owner token

- **WHEN** a deposit endpoint is called with a token whose role is not `owner`
- **THEN** the system responds with HTTP 403
