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

### Requirement: A bill's charges are labelled in the reader's language

The application SHALL label each charge on an invoice in Vietnamese, without altering what the system recorded.

The charges are the most-read text in the application: a bill is opened to answer a tenant's question about one line of it. Leaving them in the language the backend happened to write them in puts English in the middle of an otherwise Vietnamese screen, at exactly the point where comprehension matters most.

The label SHALL be built from what the line already carries — its kind, its quantity, the period it covers — rather than from the stored description, for a charge the system computed. Those charges are fully described by their own data, and the stored text adds nothing to them.

**A charge a PERSON wrote SHALL be shown exactly as written.** A service fee carries the name the owner gave it in the building's catalogue; an ad-hoc charge carries what the owner typed about what happened. Rewording either would be rewriting somebody's own words — and they may already be in Vietnamese, since the owner wrote them.

The distinction that governs this is **who wrote the text**, not which kind of line carries it. Those usually coincide and do not always: cancelling a tenancy records what the owner keeps as an ad-hoc charge, because that is the machinery it reuses, so one system-written line arrives carrying the kind that otherwise means a person wrote it. Such a line SHALL be named like any other generated text.

Nothing about what was recorded SHALL change. The stored description remains the record of what was charged, and an invoice issued before this SHALL read the same as one issued after.

#### Scenario: A computed charge

- **WHEN** the owner reads a rent, electricity or water line
- **THEN** it is labelled in Vietnamese, carrying the same quantity and period as before

#### Scenario: A charge the owner named

- **WHEN** the owner reads a service fee or an ad-hoc charge they wrote
- **THEN** it shows the words the owner wrote, unaltered

#### Scenario: A system-written charge on an ad-hoc bill

- **WHEN** the owner reads the line recording what they kept from a cancelled tenancy's deposit
- **THEN** it is named in Vietnamese, because the system wrote it and not the owner

#### Scenario: An older invoice

- **WHEN** the owner opens an invoice issued before this change
- **THEN** its charges read the same as those on a new one

#### Scenario: Nothing recorded changes

- **WHEN** an invoice is displayed
- **THEN** what the system stored for it is unchanged

### Requirement: Deposit lines keep the distinctions between them

The application SHALL name each kind of deposit line individually rather than labelling them all as a deposit.

There are four, and they are not interchangeable: the deposit charged when a tenancy begins, a top-up when a renewal raises it, an amount handed back when a renewal lowers it, and an amount kept when a tenancy is cancelled. One of them is a **negative** figure. Collapsing them into one word would leave a reader looking at a negative amount labelled "deposit" with no account of why money is going the other way.

Where a deposit line is not recognised, the application SHALL show it as stored rather than guess. An unfamiliar line then reads in English on a Vietnamese screen — which is what happens today — instead of being given a label that may be wrong about what happened.

#### Scenario: The deposit charged at move-in

- **WHEN** the owner reads the deposit line on a move-in bill
- **THEN** it is named as the deposit, with the months it was agreed in

#### Scenario: An amount handed back at renewal

- **WHEN** a renewal lowers the deposit and hands part of it back
- **THEN** that line is named as a return, distinct from a deposit being charged

#### Scenario: An amount kept at a cancellation

- **WHEN** an owner keeps part of a deposit when cancelling a tenancy
- **THEN** that line is named as an amount kept, distinct from both of the above

#### Scenario: A deposit line that is not recognised

- **WHEN** a deposit line does not match a known kind
- **THEN** it is shown as stored, rather than labelled with a guess

### Requirement: The billing screen shows the round as it is worked

While the owner is entering readings, the application SHALL show what each entry means and how much of the round is done.

Each row SHALL show the consumption its entry implies — the difference between the reading typed and the reading it opens from — as it is typed. That difference is what gets billed, and it is the figure an owner can sanity-check against a room they know. Requiring them to subtract two four-digit numbers in their head to reach it makes the check something they will stop doing.

Each row SHALL show whether it is entered, still waiting, or in error, so the state of the round reads down a column instead of being inferred from which fields happen to look filled.

The screen SHALL show how many rooms have been entered out of how many are outstanding. An owner interrupted mid-round returns to a screen that says where they were.

**None of this SHALL become a condition on issuing.** The screen may say three rooms are still waiting; it SHALL NOT withhold the seven that are ready. A round the owner cannot finish today is still a round in which seven rooms were billed.

Readings SHALL carry their unit wherever they are shown. Consumption, an opening reading and a rate are three different kinds of number, and a column of bare integers invites reading one as another.

#### Scenario: Consumption appears as the reading is typed

- **WHEN** the owner types a closing reading into a row
- **THEN** that row shows the consumption it implies, without the owner subtracting anything

#### Scenario: The state of the round is visible

- **WHEN** the owner has entered some rooms and not others
- **THEN** each row shows which of the two it is, and the screen says how many of the outstanding rooms are entered

#### Scenario: An incomplete round still issues

- **WHEN** some rooms are entered, some are empty, and one is in error
- **THEN** the entered rooms can still be issued, and nothing about the incomplete ones prevents it

#### Scenario: A room in error is distinguishable at a glance

- **WHEN** a row's reading is below the one it opens from
- **THEN** that row is distinguishable from a valid one without reading its message

### Requirement: A refusal the owner cannot act on is not offered again

When issuing a row fails, the screen SHALL distinguish a refusal from a failure to deliver, and SHALL offer the control again only where pressing it could produce a different outcome.

A rejection is the server's verdict on exactly the reading in the field. Leaving the control live invites the owner to produce that same refusal as many times as they have patience for, which is a screen wasting somebody's afternoon politely. A request that never arrived is the opposite case and SHALL stay retryable.

The block SHALL lift as soon as the reading is edited, so the owner is never stranded on a row.

A refused row SHALL NOT be counted among the rooms entered, and SHALL NOT be shown as entered. It produced no invoice, and reporting it as done contradicts the refusal displayed on the same row.

The screen SHALL NOT describe a refusal as a fault in the reading unless it is one. A reading below the one the row opens from is a data error; a month already billed says nothing about what was typed.

#### Scenario: A rejected reading cannot be resubmitted unchanged

- **WHEN** the server refuses to issue a row, on grounds that the same reading would meet again
- **THEN** that row's control refuses further attempts, and the reason is shown in the reader's language

#### Scenario: Editing the reading makes the row issuable again

- **WHEN** the owner changes the reading on a refused row
- **THEN** that row can be issued again

#### Scenario: A refused row is not counted as done

- **WHEN** a row has been refused by the server
- **THEN** it is not included in the count of rooms entered, and is not shown as entered

#### Scenario: A failure that never reached the server stays retryable

- **WHEN** issuing a row fails because the request did not arrive
- **THEN** the owner can press it again

### Requirement: A reading can be confirmed from the keyboard

The owner SHALL be able to issue the row they are typing without leaving the keyboard.

Readings are entered from a sheet of paper, ten or twenty in a sitting. A round trip to the mouse between each one is paid once per room, and it is the reason a screen that is merely usable is not the same as one somebody can get through.

Confirming from the keyboard SHALL do exactly what the row's own control does, including refusing a reading the screen has already rejected. Two ways to do one thing that behave differently is worse than one way.

#### Scenario: Confirming the row being typed

- **WHEN** the owner has typed a valid reading and confirms it from the keyboard
- **THEN** that row's invoice is issued, exactly as if its own control had been used

#### Scenario: Confirming a reading the screen has rejected

- **WHEN** the owner confirms from the keyboard a reading below the one the row opens from
- **THEN** nothing is issued, and the screen says why — as it does for the row's own control
