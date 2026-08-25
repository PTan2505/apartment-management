## Purpose

The owner's screens for billing: closing off a month across every tenancy at once, reading what a bill charged and why, and recording what has actually been collected. This is the work that repeats monthly for every occupied room, so it is designed around getting through a building rather than around a single invoice.

## Requirements

### Requirement: The owner can close off a month across every tenancy at once

The application SHALL present, for a chosen month and building, every tenancy that is due to be billed for that month and has not been, as one list the owner works down.

Billing is not an event that happens to one tenancy; it is a round the owner makes. They walk the building reading meters and then sit down to enter what they read. A screen that bills one tenancy at a time turns twenty rooms into twenty journeys through the same form, and — worse — leaves the owner with no way to know which rooms they have already done.

**What remains on the list SHALL be what remains to be done.** A tenancy disappears from it once billed. That is the whole answer to "which rooms have I not done yet", and it is answered by the shape of the screen rather than by a warning that has to be noticed.

The application SHALL show, on each row, the reading the tenancy's electricity opens from, beside the field taking the new one. A meter reading is a number with no meaning on its own — what is billed is the difference — and an owner cannot tell a plausible typo from a correct figure without the number it will be subtracted from.

The application SHALL NOT require the whole list to be completed at once. An owner interrupted halfway has billed the rooms they entered, and the rest are still waiting.

Where nothing is due, the application SHALL say the month is closed rather than showing an empty table. An empty table reads as a screen that failed to load.

#### Scenario: The month's outstanding work is listed

- **WHEN** the owner opens the billing screen for a month
- **THEN** every tenancy due to be billed for that month and not yet billed is listed, each showing the reading its electricity opens from

#### Scenario: A billed tenancy leaves the list

- **WHEN** the owner issues an invoice for a tenancy on the list
- **THEN** it is no longer listed, so what remains is what is still to be done

#### Scenario: Part of a round

- **WHEN** the owner issues invoices for some of the tenancies listed and leaves the rest
- **THEN** those issued are billed and those left remain listed for later

#### Scenario: The month is already closed

- **WHEN** the owner opens the billing screen for a month where every tenancy has been billed
- **THEN** the screen says the month is closed, rather than showing an empty table

#### Scenario: A reading below the one it opens from

- **WHEN** the owner enters a closing reading lower than the reading that tenancy opens from
- **THEN** the screen says so before the invoice is issued, because the difference is what gets billed and a negative one is a typo rather than a charge

### Requirement: A bill can be read in full, charge by charge

The application SHALL show what an invoice charged as its individual charges — rent, electricity, water, each service fee — with the rates and quantities each was computed from, and the period each covers.

A tenant querying their bill asks about one line of it, not its total. An owner who can see only the total cannot answer them, and the charges are already recorded individually with the rates applied at the time they were issued.

The application SHALL make plain which kind of bill it is. A move-in invoice charging a deposit and the first month's rent, a monthly invoice, a final invoice and an overdue invoice are answers to different questions, and a reader who cannot tell them apart will read one as another.

A voided invoice SHALL be shown as voided wherever it appears, never silently omitted or shown as a live bill.

#### Scenario: The charges are shown individually

- **WHEN** the owner opens an invoice
- **THEN** each charge is shown with what it was computed from, not only the total

#### Scenario: The kind of bill is stated

- **WHEN** the owner opens an invoice
- **THEN** the screen says which kind of bill it is

#### Scenario: A voided bill reads as voided

- **WHEN** the owner views an invoice that has been voided
- **THEN** it is shown as voided rather than as an outstanding bill

### Requirement: The owner can find the bills they are looking for

The application SHALL let the owner narrow invoices by building, by room, by month, and by whether they are settled.

Unpaid is the filter this exists for. An owner chasing money asks "who has not paid", and that question has no answer in a list ordered by anything else.

Voided invoices SHALL be excluded unless asked for. They are a record of what was withdrawn, not a bill anybody owes, and mixing them into a list of outstanding money makes that list wrong.

#### Scenario: Chasing what is owed

- **WHEN** the owner filters invoices to those not settled
- **THEN** only unpaid, non-voided invoices are listed

#### Scenario: Narrowing to a building and month

- **WHEN** the owner filters by building and month
- **THEN** only invoices for tenancies in that building, for that month, are listed

#### Scenario: Voided bills stay out of the way

- **WHEN** the owner lists invoices without asking for voided ones
- **THEN** none are listed

### Requirement: The owner can record what has been collected

The application SHALL let the owner record an invoice as paid, naming how the money arrived — cash, bank transfer, or deducted from the deposit held — and the date it arrived.

An invoice nobody marks as paid is counted as owed in every report from then on, so an owner who issues bills without a way to settle them ends up with a revenue report that is wrong in one direction and grows more wrong every month.

The date SHALL be the owner's to state rather than assumed to be today. Money collected on the 3rd and entered on the 10th belongs to the 3rd, and the report keyed on payment dates would otherwise put it in the wrong place.

Settling from the deposit SHALL be presented as what it is — money the owner has held since the tenancy began, now spent on this bill — and the application SHALL show what is held before the owner chooses it, because it can be refused for being more than the holding covers.

#### Scenario: Recording a payment

- **WHEN** the owner records an invoice as paid, naming a method and a date
- **THEN** the invoice is shown as settled and reports what settled it

#### Scenario: The date is the owner's to state

- **WHEN** the owner records a payment collected on an earlier date
- **THEN** that date is recorded, not the date of entry

#### Scenario: Settling from the deposit

- **WHEN** the owner chooses to settle a bill from the deposit held
- **THEN** the amount currently held is shown before they confirm

#### Scenario: More than the deposit covers

- **WHEN** the owner tries to settle a bill larger than the deposit held
- **THEN** the refusal is shown and the invoice remains unsettled

### Requirement: A payment recorded in error can be reversed

The application SHALL let the owner reverse a payment they recorded, on the invoice that carries it.

The mistake this screen will actually make is marking the wrong bill paid — the rooms are similar, the amounts are similar, and the rows sit next to each other. Without a way back, one slip becomes a figure that is permanently wrong in the revenue report and a tenant who is permanently recorded as having paid.

The application SHALL make clear that reversing returns the invoice to unpaid rather than deleting the record of the payment. What happened and what was undone are both part of the history.

#### Scenario: Reversing a payment

- **WHEN** the owner reverses a payment on an invoice
- **THEN** the invoice returns to unpaid and the reversal is shown in its history

#### Scenario: The payment is not erased

- **WHEN** the owner views an invoice whose payment was reversed
- **THEN** both the payment and its reversal remain visible

### Requirement: The billing screens adapt to the viewport

The application SHALL present billing on a phone as usably as on a desktop.

The month-end round is the case that matters: an owner may be entering readings while standing in the building, on the device in their hand. A table of rows that requires horizontal scrolling to reach the field being typed into is unusable exactly where it is most needed.

#### Scenario: Entering readings on a phone

- **WHEN** the owner opens the billing screen on a narrow viewport
- **THEN** each tenancy and its reading field are reachable without scrolling the page sideways

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
