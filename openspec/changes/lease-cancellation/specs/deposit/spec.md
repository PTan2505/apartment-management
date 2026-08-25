## ADDED Requirements

### Requirement: A holding is settled when a lease is cancelled

Where a cancelled lease holds a deposit, the system SHALL require the owner to say what becomes of it: how much is returned and how much is kept. The two SHALL together account for the whole holding, and the system SHALL refuse a settlement that returns and keeps more or less than is held.

This is a decision, not a calculation. Nothing in the record determines whether a tenant who changed their mind gets their money back — that is between the owner and the tenant, and the system's job is to record what was agreed rather than to compute an answer it has no basis for.

**A single figure is settled, not one per charge.** The owner is holding one sum; asking them to apportion it between the deposit and the first month's rent would be asking them to reconstruct an accounting distinction they did not make when they took the money and cannot act on when they hand it back.

Where nothing was collected — the move-in invoice unpaid — there is no holding and nothing to settle. The system SHALL void that invoice instead, so a bill for a tenancy that never happened stops being counted as owed.

#### Scenario: The whole holding is returned

- **WHEN** an authenticated owner cancels a lease holding 9,000,000 and returns all of it
- **THEN** the holding falls to zero, and nothing is recorded as earned

#### Scenario: The whole holding is kept

- **WHEN** an authenticated owner cancels a lease holding 9,000,000 and keeps all of it
- **THEN** the holding falls to zero, and the whole amount is recorded as revenue

#### Scenario: The holding is split

- **WHEN** an authenticated owner cancels a lease holding 9,000,000, returning 6,000,000 and keeping 3,000,000
- **THEN** the holding falls to zero, and 3,000,000 is recorded as revenue

#### Scenario: A settlement that does not account for the holding

- **WHEN** an authenticated owner cancels a lease holding 9,000,000 and states amounts summing to anything other than 9,000,000
- **THEN** the system refuses and the holding is unchanged

#### Scenario: Cancelling a tenancy whose bill was never paid

- **WHEN** an authenticated owner cancels a lease whose move-in invoice is unpaid
- **THEN** that invoice is voided, no settlement is required, and nothing is recorded as revenue

#### Scenario: Cancelling a tenancy that took no deposit

- **WHEN** an authenticated owner cancels a lease whose move-in invoice was paid but which charged no deposit
- **THEN** the cancellation proceeds without a settlement to make

### Requirement: What the owner keeps at a cancellation is revenue

An amount kept from a cancelled tenancy's holding SHALL be recorded as revenue, attributed to the month the cancellation was recorded.

It is money that has stopped being the tenant's, earned in compensation for a room held off the market. A deposit is excluded from revenue everywhere else in this system precisely because it may have to be given back; once it is decided that it will not be, that reason no longer holds. Leaving it out would report an owner as having earned nothing from a room they were paid for and could not let.

An amount returned SHALL NOT be recorded as revenue, an expense, or anything else. It is the tenant's own money going back to them, and the system already treats such movements as changing whose hands money is in rather than as earning or spending.

#### Scenario: A kept amount reaches the revenue report

- **WHEN** an owner keeps 3,000,000 from a cancelled tenancy in March
- **THEN** the revenue report for March counts 3,000,000 for that building

#### Scenario: A returned amount does not

- **WHEN** an owner returns the whole holding of a cancelled tenancy
- **THEN** the revenue report is unchanged by the cancellation

#### Scenario: The kept amount is identifiable

- **WHEN** an owner examines what a kept amount was for
- **THEN** it is legible as belonging to that cancelled tenancy, rather than appearing as an unexplained sum
