## ADDED Requirements

### Requirement: Ending, renewing or cancelling a tenancy says what is still owed

Each of the three endings SHALL show, before it is carried out, how many of the
tenancy's bills are unpaid and what they come to.

The figure SHALL count the same bills the tenancy's invoice panel counts as
owed — issued, not withdrawn, not paid — so the two cannot state different
amounts about the same tenancy.

It SHALL NOT prevent the action. A tenant who has moved out has moved out, and
a system that refused to record it would leave the room held by a tenancy
nobody is in. The owner is told and decides.

Where nothing is owed, nothing SHALL be said. A warning that appears every time
is a warning nobody reads.

#### Scenario: Ending a tenancy with bills outstanding

- **WHEN** the owner opens the move-out dialog for a tenancy with two unpaid bills
- **THEN** it says two bills are unpaid and what they total, before anything is recorded

#### Scenario: Renewing with bills outstanding

- **WHEN** the owner renews a tenancy that still owes money
- **THEN** the dialog says so, because the debt stays with the tenancy being closed rather than moving to its successor

#### Scenario: Cancelling with bills outstanding

- **WHEN** the owner cancels a tenancy that has unpaid bills
- **THEN** the dialog says so, because cancelling records the tenancy as never having happened

#### Scenario: Nothing owed

- **WHEN** every bill of the tenancy is settled
- **THEN** no such warning is shown

#### Scenario: The warning does not block

- **WHEN** the owner proceeds despite the warning
- **THEN** the action is carried out as it would be otherwise

### Requirement: The three endings are confirmed before they happen

Ending, renewing and cancelling a tenancy SHALL each ask the owner to confirm,
naming the tenancy and what the action does, and SHALL carry it out only on
that confirmation.

Each is irreversible by the screen that offers it: a move-out issues the final
bill and frees the room, a renewal closes one tenancy and opens another, a
cancellation states that the tenancy never took place. None of them should turn
on a single click landing on a submit button.

#### Scenario: Confirming a move-out

- **WHEN** the owner submits the move-out dialog
- **THEN** they are asked to confirm, and nothing is recorded until they do

#### Scenario: Confirming a renewal

- **WHEN** the owner submits the renewal dialog
- **THEN** they are asked to confirm, and no tenancy is opened or closed until they do

#### Scenario: Confirming a cancellation

- **WHEN** the owner submits the cancellation dialog
- **THEN** they are asked to confirm, and nothing is cancelled until they do

#### Scenario: Declining the confirmation

- **WHEN** the owner declines at the confirmation
- **THEN** nothing happens and the dialog they filled in is still there, with what they entered
