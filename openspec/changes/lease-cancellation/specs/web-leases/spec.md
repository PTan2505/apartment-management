## ADDED Requirements

### Requirement: The owner can cancel a tenancy that never happened

The application SHALL offer to cancel a tenancy on its own screen, where cancelling is permitted, and SHALL NOT offer it where it is not.

Withholding the action is the whole difficulty this addresses. Today a tenant who backs out leaves a lease that cannot be closed by any means, and an owner discovers that only by trying a move-out and reading two refusals in a row. Offering the right action where it applies replaces both.

The application SHALL make plain that this is not a move-out: it records that the tenancy never took place. A tenancy that has been billed a monthly invoice SHALL NOT offer it, and the screen SHALL say that such a tenancy is ended by recording a move-out instead — an owner who cannot find the action needs to be told what to look for, not left to guess.

A cancelled tenancy SHALL be visibly distinct from one that ran and ended, wherever tenancies are listed or shown. Reading a tenancy that never happened as history that did is how a room's past is misremembered.

#### Scenario: Cancelling is offered where it applies

- **WHEN** the owner opens a running tenancy that has been billed no monthly invoice
- **THEN** a way to cancel it is offered, described as recording that the tenancy never took place

#### Scenario: Cancelling is not offered where it does not apply

- **WHEN** the owner opens a tenancy that has been billed a monthly invoice
- **THEN** no way to cancel it is offered, and the screen says such a tenancy is ended by recording a move-out

#### Scenario: A cancelled tenancy is distinguishable

- **WHEN** the owner views a cancelled tenancy, in a list or on its own screen
- **THEN** it is shown as cancelled, distinct from one that ran and ended

### Requirement: The money is shown before the owner commits

Where a cancelled tenancy holds money, the application SHALL show the amount held before the owner confirms, and SHALL let them state how much goes back and how much is kept.

The two amounts SHALL be shown to account for the whole holding as they are entered, so a settlement that does not add up is visible before it is submitted rather than after it is refused. Neither amount SHALL be assumed: returning everything and keeping everything are both ordinary outcomes, and defaulting to either would put a figure in front of an owner that they may accept without deciding.

The application SHALL say plainly that a kept amount is recorded as revenue, because that is a consequence the owner cannot see from the screen and would otherwise discover in a report months later.

Where nothing was collected, the application SHALL say so and ask for no figures — there is nothing to settle, and presenting empty money fields would suggest otherwise.

#### Scenario: The holding is shown before confirming

- **WHEN** the owner begins cancelling a tenancy whose move-in bill was paid
- **THEN** the amount held is shown, with fields for how much is returned and how much is kept

#### Scenario: A settlement that does not add up

- **WHEN** the amounts entered do not account for the whole holding
- **THEN** the screen says so, and the cancellation cannot be confirmed

#### Scenario: Nothing was collected

- **WHEN** the owner begins cancelling a tenancy whose move-in bill was never paid
- **THEN** the screen says there is nothing to settle and asks for no amounts

#### Scenario: The consequence of keeping is stated

- **WHEN** the owner is about to keep part or all of a holding
- **THEN** the screen says that amount will be recorded as revenue

#### Scenario: The room is free afterwards

- **WHEN** a tenancy is cancelled
- **THEN** its room is offered again for a new tenancy without the screen being reloaded
