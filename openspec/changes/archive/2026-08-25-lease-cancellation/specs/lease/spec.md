## ADDED Requirements

### Requirement: Owner can cancel a lease that was never lived in

The system SHALL allow an authenticated `owner` to cancel a lease, recording that the tenancy never took place rather than that it ended.

This is a different event from a move-out and SHALL NOT be expressible as one. A move-out closes a tenancy that happened: it takes a closing meter reading, bills a final month, and prorates the days occupied. A cancellation has none of those to take — nobody occupied a day — and the system already refuses to pretend otherwise, rejecting a move-out dated before the start and rejecting one dated on it for covering no days. Without a cancellation those refusals leave the lease with no way out at all: its room held, its move-in invoice outstanding, and nothing correctable.

**Cancellation SHALL be permitted only while no monthly invoice has been issued against the lease.** A monthly invoice is the point past which a tenancy has demonstrably been lived in and billed for, and unwinding it is a different and larger problem. The system SHALL refuse in those terms, naming the move-out as what is wanted instead.

The start date SHALL NOT restrict it. A tenant who promised to arrive and never did leaves a lease whose start date has passed and which was never occupied, and that is precisely the case this exists for.

A lease already cancelled, or one that has recorded a move-out, SHALL NOT be cancellable.

The date of the cancellation SHALL be recorded. When the owner gave up on a tenancy is a fact about the room's history, and without it a cancelled lease cannot be placed in time at all.

#### Scenario: Cancelling a tenancy that never started

- **WHEN** an authenticated owner cancels a lease whose start date has not arrived and which has been billed no monthly invoice
- **THEN** the system records it as cancelled, together with the date

#### Scenario: Cancelling after the start date has passed

- **WHEN** an authenticated owner cancels a lease whose start date has passed but which has been billed no monthly invoice
- **THEN** the system records it as cancelled, because the start date says when a tenancy was due to begin and not that it did

#### Scenario: A tenancy that has been billed cannot be cancelled

- **WHEN** an authenticated owner cancels a lease that has been issued a monthly invoice
- **THEN** the system refuses, and says that a tenancy which has been billed is ended by recording a move-out

#### Scenario: A tenancy that has already ended cannot be cancelled

- **WHEN** an authenticated owner cancels a lease that has recorded a move-out
- **THEN** the system refuses

#### Scenario: Cancelling twice

- **WHEN** an authenticated owner cancels a lease that is already cancelled
- **THEN** the system refuses and nothing changes

### Requirement: A lease reports whether it can be cancelled

The system SHALL report, on every lease it returns, whether that tenancy can be cancelled, and whether it has been billed for a month.

The rule behind cancellation lives in the service that enforces it. A caller deciding whether to offer the action would otherwise have to restate that rule — fetch the tenancy's invoices, look for a monthly one, and combine it with the status — which is the same rule written a second time and free to drift from the first. Offering an action the system refuses is the visible half of that drift; withholding one it would have allowed is the half nobody reports.

Both facts SHALL be reported, not just the verdict. A caller that withholds the action needs to say why, and "it has been billed" is the reason an owner can act on.

This SHALL cost no additional request per lease. It is a fact about the tenancy, and a listing of twenty must not become twenty-one requests to report it.

#### Scenario: A cancellable tenancy says so

- **WHEN** an authenticated owner retrieves a running lease that has been billed no monthly invoice
- **THEN** the response reports it as cancellable, and as not having been billed for a month

#### Scenario: A billed tenancy says why it is not

- **WHEN** an authenticated owner retrieves a running lease that has been issued a monthly invoice
- **THEN** the response reports it as not cancellable, and as having been billed for a month

#### Scenario: A tenancy that is over is not cancellable

- **WHEN** an authenticated owner retrieves a lease that has recorded a move-out, or one already cancelled
- **THEN** the response reports it as not cancellable

#### Scenario: Reported across a listing

- **WHEN** an authenticated owner lists leases
- **THEN** every lease in the page carries both facts, without a request per lease

### Requirement: Cancelling frees the room immediately

A cancelled lease SHALL NOT hold its room. The room SHALL report itself as available, SHALL appear among rooms that can be let, and SHALL accept a new lease starting on any date.

Freeing the room is most of the point. A tenancy that never happened occupies no days, so it constrains no future tenancy's start date — unlike a tenancy that ended, whose dates a successor must not overlap.

#### Scenario: The room is available again

- **WHEN** a lease on a room is cancelled
- **THEN** the room reports itself as not let, and appears among rooms with no running tenancy

#### Scenario: The room accepts a new tenancy

- **WHEN** an authenticated owner creates a lease for a room whose only other lease was cancelled
- **THEN** the system creates it

#### Scenario: A cancelled tenancy constrains no start date

- **WHEN** an authenticated owner creates a lease starting before the cancelled lease's own start date
- **THEN** the system creates it, because a tenancy that never happened covered no days for a new one to overlap

#### Scenario: A cancelled tenancy remains in the room's history

- **WHEN** an authenticated owner lists the leases for a room whose lease was cancelled
- **THEN** the cancelled lease is included, marked as cancelled

## MODIFIED Requirements

### Requirement: Lease status, expected end date, and tenant are derived
The system SHALL derive a lease's expected end date from its start date and agreed duration, its status from whether it has been cancelled or has recorded a move-out, its tenant from the current primary occupant, and its deposit amount from the agreed rent and the number of deposit months. None of these SHALL be independently settable, so they can never contradict the records they come from.

**A lease's status SHALL distinguish three states: running, finalized, and cancelled.** A tenancy that never took place is not one that ran and ended, and reporting them alike would present as history something that never happened — inflating how many tenancies a room has had, and how many a person has held.

A date that ends a tenancy SHALL be **exclusive**: it is the first day the tenancy no longer covers, and the last day covered is the day before it. This SHALL hold for both the expected end date and the move-out date, so that a reader never has to remember which of them counts its own day and which does not.

A lease beginning 1 January for six months therefore has an expected end date of 1 July and covers through 30 June. A lease whose move-out is recorded as 5 July covers through 4 July. In both cases a new lease beginning on that same date follows with neither a gap nor an overlap.

The expected end date SHALL NOT constrain the move-out date. It states when the agreement ends, not when the tenant left — a tenant may stay past it without either party wanting a renewal, and the record SHALL be able to say so.

**A cancelled lease's dates describe an agreement, not an occupancy.** Its expected end date SHALL continue to be reported, because it states what was agreed, but nothing SHALL present it as days the tenancy covered.

The deposit amount SHALL be reported alongside the number of months it was agreed in, so that a caller can show either without computing it. It SHALL follow the lease's own agreed rent rather than the room's current rent, because the deposit was agreed against the rent in the lease.

#### Scenario: Expected end date reflects start date and duration
- **WHEN** an authenticated owner retrieves a lease starting 2026-01-15 with an agreed duration of 12 months
- **THEN** the response reports an expected end date of 2027-01-15

#### Scenario: The expected end date is the first day not covered
- **WHEN** a lease begins 2026-01-01 with an agreed duration of six months
- **THEN** its expected end date is 2026-07-01 and the last day it covers is 2026-06-30

#### Scenario: A renewal begins where the previous term ended
- **WHEN** a lease's expected end date is 2026-07-01 and a new lease for the same room begins on that date
- **THEN** the two tenancies neither overlap nor leave a day uncovered

#### Scenario: A move-out date is the first day not covered
- **WHEN** a lease records a move-out dated 2026-07-05
- **THEN** the last day it covers is 2026-07-04

#### Scenario: A renewal begins on the date the previous tenancy ended
- **WHEN** a lease records a move-out dated 2026-07-05 and a new lease for the same room begins on 2026-07-05
- **THEN** the two tenancies neither overlap nor leave a day uncovered

#### Scenario: A tenant who left after the term is recorded as they left
- **WHEN** an authenticated owner records a move-out dated after the lease's expected end date, because the tenant stayed on and neither party wanted a renewal
- **THEN** the system accepts it and records that date, rather than requiring a date that did not happen

#### Scenario: Lease without a move-out date is active
- **WHEN** an authenticated owner retrieves a lease that has no move-out date and has not been cancelled
- **THEN** the response reports the lease as active

#### Scenario: Lease with a move-out date is finalized
- **WHEN** an authenticated owner retrieves a lease that has a move-out date
- **THEN** the response reports the lease as finalized

#### Scenario: A cancelled lease reports itself as cancelled

- **WHEN** an authenticated owner retrieves a lease that has been cancelled
- **THEN** the response reports it as cancelled, distinct from both active and finalized

#### Scenario: Expected end date follows an updated duration
- **WHEN** an authenticated owner changes a lease's agreed duration
- **THEN** the expected end date reported for that lease changes accordingly

#### Scenario: Reported tenant follows a transfer of responsibility
- **WHEN** primary responsibility for a lease is transferred to another occupant
- **THEN** the lease reports that person as its tenant

#### Scenario: Deposit amount is derived from the agreed rent
- **WHEN** an authenticated owner retrieves a lease with an agreed rent of 3,000,000 and a deposit of two months
- **THEN** the response reports a deposit amount of 6,000,000

#### Scenario: A zero-month deposit reports a zero amount
- **WHEN** an authenticated owner retrieves a lease whose deposit is zero months
- **THEN** the response reports a deposit amount of zero

#### Scenario: Deposit amount ignores a later change to the room's rent
- **WHEN** a room's base rent is changed after a lease on it was created
- **THEN** that lease still reports a deposit amount derived from its own agreed rent

### Requirement: A room has at most one active lease
The system SHALL reject a new lease for a room that already has an active lease. Once the existing lease records a move-out **or is cancelled**, the room SHALL accept a new lease, and the previous lease SHALL be retained as history.

The system SHALL further reject a new lease whose start date falls before the most recent tenancy on that room ended, so that no day is covered by two leases at once. Because an ending date is the first day no longer covered, a new lease MAY begin on exactly the date the previous one ended, and no earlier — the two then meet with neither a gap nor an overlap.

**A cancelled lease SHALL be excluded from that comparison entirely.** It covered no days, so there is nothing for a new tenancy to overlap; treating its dates as occupied would block a room the cancellation was performed to free.

A start date later than the previous tenancy's end SHALL be accepted. A room may stand empty between tenancies, and the days in between belong to nobody rather than being an error.

No other constraint SHALL be placed on the start date. A tenancy may begin on any day of any month; only overlapping a previous tenancy is refused.

#### Scenario: Room already has an active lease
- **WHEN** an authenticated owner creates a lease for a room whose existing lease has no move-out date and has not been cancelled
- **THEN** the system responds with HTTP 409 and does not create the lease

#### Scenario: Re-letting a room after a cancellation

- **WHEN** an authenticated owner creates a lease for a room whose only other lease was cancelled
- **THEN** the system creates it, whatever its start date

#### Scenario: Re-letting a room after move-out
- **WHEN** an authenticated owner creates a lease for a room whose previous lease has recorded a move-out, starting on or after that date
- **THEN** the system creates the new lease successfully and the previous lease remains unchanged as history

#### Scenario: A new lease beginning on the date the previous one ended
- **WHEN** an authenticated owner creates a lease starting on exactly the date the room's previous lease recorded as its move-out
- **THEN** the system creates it, because that date is the first day the previous tenancy no longer covers

#### Scenario: A new lease overlapping the previous tenancy
- **WHEN** an authenticated owner creates a lease for a room, starting before the date the previous lease recorded as its move-out
- **THEN** the system responds with HTTP 409 and does not create the lease, because both tenancies would be billed for the same days

#### Scenario: A gap between tenancies is allowed
- **WHEN** an authenticated owner creates a lease starting well after the room's previous lease ended
- **THEN** the system creates it, because a room may stand empty between tenancies

#### Scenario: A tenancy may begin on any day of the month
- **WHEN** an authenticated owner creates a lease starting partway through a month, not overlapping any previous tenancy on that room
- **THEN** the system creates it

#### Scenario: The check considers the room's most recent tenancy
- **WHEN** a room has been let several times and an authenticated owner creates a lease starting before the latest of those ended
- **THEN** the system responds with HTTP 409, even where the start date falls after some earlier tenancy ended

#### Scenario: A room's first lease has nothing to overlap
- **WHEN** an authenticated owner creates the first lease a room has ever had
- **THEN** the system creates it whatever its start date

#### Scenario: Room accumulates lease history
- **WHEN** an authenticated owner lists the leases for a room that has been let several times
- **THEN** the response includes every past lease along with the current one
