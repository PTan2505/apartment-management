## ADDED Requirements

### Requirement: The owner can close a tenancy that has ended

The application SHALL offer, on a running tenancy, an action that records the tenant having moved out: the date they left and the meter reading taken at handover.

Until now this existed only in the API. The only ending an owner could reach was the one that records a tenancy as never having happened, which on a tenant who lived somewhere for a year erases the year — and a tenancy left open holds its room against every new one.

The application SHALL state, before the owner confirms, what closing does: the final bill for that month is issued, the people recorded as living there are recorded as having left, and the room becomes free.

The closing reading SHALL be offered with the room's last known reading in view, so the owner can tell whether what they are entering continues from it.

Where the departure falls AFTER the agreed end date, the application SHALL say so and SHALL let the owner name charges for the days beyond the term. Each charge SHALL be picked from the building's fee catalogue, so the name stays comparable with every other bill, while the amount is the owner's to set. Naming nothing SHALL be accepted as a deliberate waiver.

The action SHALL NOT be offered on a tenancy that has already recorded a move-out or been cancelled.

The application SHALL NOT offer it as a way to correct a tenancy that never began: that is what cancelling is for, and the two SHALL remain distinct actions with distinct words.

#### Scenario: Closing a tenancy

- **WHEN** the owner records the date a tenant left and the closing meter reading
- **THEN** the tenancy is reported as finished, its final bill is issued, its occupants are recorded as departed, and the room is free

#### Scenario: What closing does is said first

- **WHEN** the owner is about to confirm
- **THEN** the dialog says the final bill will be issued, the occupants recorded as departed, and the room freed

#### Scenario: A departure after the agreed end

- **WHEN** the owner records a departure dated after the agreed end date
- **THEN** the dialog says the days beyond the term are not covered by the agreement, and offers to name charges for them from the building's fees

#### Scenario: Waiving the extra days

- **WHEN** the owner records a late departure and names no charges
- **THEN** the closing is accepted and nothing is charged for those days

#### Scenario: A reading that contradicts what was billed

- **WHEN** the owner enters a closing reading below what this tenancy has already been invoiced for
- **THEN** the reason the API gave is shown, the dialog stays open, and the tenancy is unchanged

#### Scenario: Not offered where it cannot apply

- **WHEN** the owner opens a tenancy that has already ended or been cancelled
- **THEN** no closing action is offered

### Requirement: A finished tenancy shows what its deposit settles to

Where a tenancy has recorded a move-out and its deposit has not yet been returned, the application SHALL show what is held, what has been deducted from it, and what is still owed on unpaid invoices — and SHALL let the owner record the return of the deposit.

A deposit is the last thing between an owner and a closed file, and the figures that decide it live in three places: the holding, the deductions, and the bills still unpaid. An owner adding those up by hand is an owner who will sometimes get it wrong in the tenant's favour and sometimes in their own.

The unpaid bills SHALL be shown as context rather than subtracted automatically. What a deposit covers is the owner's decision, and a screen that quietly nets them off would make that decision silently.

Once returned, the application SHALL report when it was returned and SHALL NOT offer to return it again.

#### Scenario: Reading the settlement

- **WHEN** the owner opens a tenancy that has recorded a move-out
- **THEN** the deposit held, the amount deducted from it, and the total still unpaid on its invoices are shown

#### Scenario: Recording the return

- **WHEN** the owner records the deposit as returned
- **THEN** the tenancy reports it as returned, with the date

#### Scenario: A deposit already returned

- **WHEN** the owner opens a tenancy whose deposit has been returned
- **THEN** the date it was returned is shown and no second return is offered

#### Scenario: A running tenancy

- **WHEN** the owner opens a tenancy that has not recorded a move-out
- **THEN** no deposit return is offered, because there is nothing to settle yet

### Requirement: A refusal names an action the owner can find

Where the application reports that some other action is the right one, that action SHALL exist on a screen the owner can reach.

This is not a general principle in search of a case. The refusal shown when the only occupant is departed names the tenancy's closing, and that closing existed nowhere — so an owner following the instruction exactly would find nothing and conclude the system was broken.

#### Scenario: The last occupant cannot depart

- **WHEN** the owner tries to record a departure for the only person living in a tenancy
- **THEN** the message names closing the tenancy, and that action is on the same screen
