## ADDED Requirements

### Requirement: The owner can withdraw a bill issued in error

The application SHALL let the owner withdraw an invoice from the invoice itself, and SHALL require them to say why.

This is the answer to the mistake the billing screen makes. Entering a meter reading for every occupied room in a building produces typos at that volume, and the only check available there is that a reading is not below the one it opens from — a reading of 280 where the meter says 260 passes it, and bills the tenant for twenty units they did not use. Without this, a wrong bill can be neither corrected nor withdrawn from anywhere in the application.

The application SHALL make plain that the bill is kept rather than deleted, and stops counting towards anything owed. An owner who believes they are erasing a record will hesitate over an action that is safe, and one who believes they are erasing it when they are not has been misled.

The reason SHALL be required and free text. What went wrong is genuinely varied — a misread meter, a bill against the wrong tenancy, a charge waived after a conversation — and a fixed list would either be wrong or grow to the point of being unreadable.

#### Scenario: Withdrawing a bill

- **WHEN** the owner withdraws an unpaid invoice, giving a reason
- **THEN** it is shown as voided, carrying that reason

#### Scenario: A reason is required

- **WHEN** the owner tries to withdraw a bill without giving a reason
- **THEN** the withdrawal cannot be confirmed

#### Scenario: What withdrawing does is stated

- **WHEN** the owner is about to withdraw a bill
- **THEN** the screen says it is kept as a record and stops counting towards what is owed

#### Scenario: The reason is visible afterwards

- **WHEN** the owner views a voided invoice
- **THEN** the reason it was withdrawn is shown alongside the date

### Requirement: A paid bill explains what has to happen first

Where a bill has been paid, the application SHALL NOT offer to withdraw it, and SHALL say that the payment is reversed first.

The system refuses this outright, because withdrawing a bill while the money paid for it stays put leaves an owner holding cash against nothing. Offering the action and reporting that refusal makes the owner discover a rule the screen already knew — and the thing they need is not the refusal but the step before it, which is on the same screen.

#### Scenario: A paid bill

- **WHEN** the owner views a paid invoice
- **THEN** no way to withdraw it is offered, and the screen says the payment is reversed first

#### Scenario: After reversing

- **WHEN** the owner reverses the payment on that invoice
- **THEN** withdrawing it becomes available

### Requirement: Withdrawing a bill carries the owner on to reissuing it

After a bill is withdrawn, the application SHALL say that its tenancy is back on that month's billing list, and offer to go there.

Withdrawing is almost never the goal. The owner is correcting a bill, and stopping at "withdrawn" leaves them mid-task with no indication of where the other half happens. Reissuing goes through the month's billing list, which is where every monthly invoice is issued — deliberately, so that correcting one does not become a second way into issuing them.

Where the withdrawn bill covers no month — a move-in or ad-hoc invoice, which no billing list will offer — the application SHALL NOT claim otherwise.

#### Scenario: Carried on to reissuing

- **WHEN** the owner withdraws a monthly invoice
- **THEN** the screen says its tenancy is back on that month's billing list and offers to go there

#### Scenario: The billing list offers it again

- **WHEN** the owner follows that offer
- **THEN** the tenancy is listed for that month, opening from the same reading as before

#### Scenario: A bill that covers no month

- **WHEN** the owner withdraws a move-in or ad-hoc invoice
- **THEN** the screen does not offer a billing list, because none covers it
