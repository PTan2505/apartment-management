## MODIFIED Requirements

### Requirement: Owner can return a deposit and close the holding

The system SHALL allow an authenticated `owner` to record that a departing tenant's deposit has been returned. The return SHALL be of **the whole holding**: whatever the lease still holds is what goes back, and no amount SHALL be supplied.

Keeping part of a deposit SHALL therefore require charging for that part first, on an ad-hoc invoice settled by deduction from the deposit. The holding shrinks by the amount charged, and what remains is returned in full.

This is deliberate and is the point of requiring it. An owner who may return less than they hold, giving only a free-text reason, moves money out of the books entirely: the amount kept is not revenue, not an expense, and no longer a holding. Removing the amount closes that route rather than merely offering a better one beside it — and the charge that replaces it carries a category and a figure, which a sentence never did.

Recording the return SHALL close the holding: the lease SHALL afterwards report holding nothing.

A return SHALL be recorded only for a lease that has recorded a move-out. A tenancy still running has not finished with its deposit.

A return SHALL be recordable only once per lease.

A return SHALL NOT appear as an expense and SHALL NOT reduce net profit in any month. Handing back money that was never earned is not a cost.

#### Scenario: Returning the whole deposit

- **WHEN** an authenticated owner records a return for a finalized lease holding 3,000,000
- **THEN** 3,000,000 is recorded as returned, the lease reports holding nothing, and the return is dated

#### Scenario: Returning less than was held, with a reason

- **WHEN** an authenticated owner charges 200,000 for a broken window on an ad-hoc invoice, settles it from a deposit of 3,000,000, and then records the return
- **THEN** 2,800,000 is returned, the 200,000 is revenue carrying its own category and description, and the lease reports holding nothing

#### Scenario: Returning more than is held

- **WHEN** a request to return a deposit supplies an amount larger than the holding
- **THEN** the amount is ignored and the holding is returned in full, because the request has no say in the figure

#### Scenario: An amount cannot be supplied

- **WHEN** a request to return a deposit supplies an amount smaller than the holding
- **THEN** it is ignored, and the whole holding is returned

#### Scenario: Returning a holding of nothing

- **WHEN** an authenticated owner records a return for a finalized lease whose deposit was entirely spent on what it owed
- **THEN** a return of zero is recorded and the lease reports the deposit as settled

#### Scenario: The owner decides the figure

- **WHEN** an authenticated owner requests the settlement figures for a departing lease
- **THEN** the system reports what is held and what has been deducted, and does not propose an amount to return

#### Scenario: Returning a deposit on a running tenancy

- **WHEN** an authenticated owner records a return for a lease with no move-out date
- **THEN** the system responds with HTTP 409 and nothing is recorded

#### Scenario: Returning twice

- **WHEN** an authenticated owner records a return for a lease whose deposit has already been returned
- **THEN** the system responds with HTTP 409 and the original return is unchanged

#### Scenario: A return is not an expense

- **WHEN** a deposit is returned in a month
- **THEN** that month's expenses and net figures in the revenue report are unchanged by it
