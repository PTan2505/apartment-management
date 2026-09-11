## Purpose

The owner's screens for tenancies: seeing which rooms are let and to whom, signing a new agreement, keeping its terms current, and maintaining the record of who lives there.

## Requirements

### Requirement: The owner can see the tenancies they hold

The application SHALL list leases, most recently begun first, each showing the room, the person responsible for the agreement, the agreed rent, the dates the tenancy covers, and whether it is still running.

A lease with no recorded tenant SHALL say so rather than showing an empty space. This happens legitimately — the last occupant departed before a move-out was recorded — and a blank reads as data missing rather than a state the system allows.

Listing SHALL be paginated, and SHALL report how many tenancies match rather than only how many are on the page.

#### Scenario: Tenancies are listed newest first

- **WHEN** the owner opens the leases screen
- **THEN** the tenancies appear with the most recently begun at the top, each showing its room, tenant, rent, dates, and whether it is running

#### Scenario: A tenancy with no current tenant

- **WHEN** a listed lease has no primary occupant
- **THEN** it is shown as having no recorded tenant, rather than with an empty name

#### Scenario: No tenancies at all

- **WHEN** the owner opens the leases screen and no lease exists
- **THEN** they are told so plainly, with the way to create one still offered

### Requirement: A tenancy whose term has run out is visible without being searched for

The application SHALL distinguish, in the list itself, a lease whose agreed term has ended while no move-out has been recorded.

Such a lease needs attention and cannot be left alone: no further invoice can be issued against it, and its room stays held against a new tenancy until it is closed or renewed. A filter alone is not sufficient — a filter finds these only for an owner who already suspects they exist, and the whole difficulty is that nothing announces them.

**Marking them in the list is also not sufficient on its own.** Tenancies are listed most recently begun first, and a tenancy whose term has run out is usually one of the oldest — so it settles on the last page, which is the page an owner does not open. A mark nobody scrolls to is not a warning.

The application SHALL therefore state how many such tenancies exist, wherever in the list the owner is, and offer to show them. It SHALL NOT state it while they are the only ones being shown, since repeating a count above the very rows it counts says nothing.

The same condition SHALL also be available as a filter, so a screen full of tenancies can be narrowed to the ones needing action.

#### Scenario: A tenancy past its term is marked in the list

- **WHEN** the owner opens the leases screen and one lease's agreed term has ended with no move-out recorded
- **THEN** that lease is visibly distinguished from the others without any filter being applied

#### Scenario: The count is stated even when none is on the page

- **WHEN** tenancies needing attention exist but none of them falls on the page being viewed
- **THEN** the screen still states how many there are, and offers to show them

#### Scenario: Showing them from the statement

- **WHEN** the owner takes up that offer
- **THEN** the list narrows to exactly those tenancies, and the count is no longer stated

#### Scenario: Narrowing to tenancies needing attention

- **WHEN** the owner filters to leases whose term has run out unclosed
- **THEN** only those leases are listed

#### Scenario: A tenancy still within its term is not marked

- **WHEN** a running lease has not yet reached its expected end date
- **THEN** it is not distinguished as needing attention

#### Scenario: A closed tenancy is not marked

- **WHEN** a lease whose term ended has since recorded a move-out
- **THEN** it is not distinguished as needing attention, because none is needed

### Requirement: The owner can narrow tenancies to what they are looking at

The application SHALL let the owner narrow the list by building, by room, by a person who has occupied it, and by whether the tenancy is still running. Filters SHALL combine, and the totals reported SHALL describe the filtered set rather than everything.

Choosing a building SHALL also narrow the rooms offered to that building's. A room code identifies a room only within its building, so a flat list of every room an owner holds is both long and ambiguous — the same code appears more than once. Changing the building SHALL clear any room already chosen, because that room belongs to a building no longer selected.

Filtering by person SHALL find every tenancy that person occupied, whether or not they were the one responsible for it, and including tenancies that have ended. Where a person has lived somewhere is a question about their history, not about who signed.

#### Scenario: Narrowing by room

- **WHEN** the owner filters the list to one room
- **THEN** only that room's tenancies are listed, including ended ones

#### Scenario: Narrowing by person

- **WHEN** the owner filters the list by a person
- **THEN** every tenancy that person occupied is listed, whether they were responsible for it or not, and including ended ones

#### Scenario: Narrowing by building

- **WHEN** the owner filters the list to one building
- **THEN** only tenancies for rooms in that building are listed, and the rooms offered are that building's

#### Scenario: Changing the building clears the room

- **WHEN** the owner has chosen a room and then chooses a different building
- **THEN** the room is no longer applied, and the list is not narrowed to a room outside the chosen building

#### Scenario: Filters combine

- **WHEN** the owner filters by room and to running tenancies at once
- **THEN** only tenancies matching both are listed, and the reported total counts only those

### Requirement: A tenancy can be read in full

The application SHALL let the owner open a lease and see its room, the person responsible, the agreed rent, the agreed duration, the number of people it is billed for, the deposit, and the dates the tenancy covers.

The deposit SHALL be shown as an amount **together with the number of months it was agreed in**. The amount alone cannot be checked against anything; the months are what was actually negotiated.

The screen SHALL open with what identifies the tenancy and what is true of it now — the room and the person responsible, whether it is running, and how much of the agreed term remains — before the terms are enumerated. An owner opens this screen to answer "how long is left" far more often than to re-read a clause, and a summary reached only by reading down a list of equal-weight rows is a summary the screen failed to give.

Among the terms, the money SHALL read first. Rent and deposit are what a tenancy is argued about; presenting them at the same weight as every other field makes the reader find them rather than see them.

The screen SHALL state only what the system holds. Where the record has no answer, the screen SHALL omit the field rather than show a placeholder, a zero, or a plausible default — a fabricated term on a screen that reads as a contract is worse than an absent one, because the reader has no way to tell the two apart.

#### Scenario: Opening a tenancy

- **WHEN** the owner opens a lease
- **THEN** its room, tenant, rent, duration, occupant count, deposit, and dates are shown

#### Scenario: What is true now is stated before the terms

- **WHEN** the owner opens a running lease
- **THEN** the room, the person responsible, that it is running, and how much of the term remains are stated together, above the enumerated terms

#### Scenario: A tenancy that has ended

- **WHEN** the owner opens a lease that is no longer running
- **THEN** the summary says so, and does not report remaining time as though the tenancy were current

#### Scenario: The deposit shows what it was agreed in

- **WHEN** a lease's deposit was agreed as two months of a rent of 3,000,000
- **THEN** the deposit is shown as 6,000,000 and as two months, not only as an amount

#### Scenario: A term the record does not hold

- **WHEN** the agreement has a term the system does not record
- **THEN** the screen shows nothing for it, rather than a default or an empty value presented as the answer

#### Scenario: A tenancy that does not exist

- **WHEN** the owner opens an address for a lease that does not exist
- **THEN** they are told it was not found, rather than shown an empty tenancy

### Requirement: The dates shown are the days the tenancy covers

A date that ends a tenancy is exclusive: it is the first day no longer covered. The application SHALL present tenancy dates so that a reader takes away the days actually covered, and SHALL NOT present an exclusive end date as though the tenancy runs through it.

This is not presentation for its own sake. An owner reading "ends 01/07/2026" beside a tenant who must be out on 30 June will act on the wrong day — arranging a cleaner, showing the room, or billing a month that was never covered.

Where a tenancy has ended, the application SHALL show that it ended and through which day, distinguishing a tenancy that ran its agreed term from one that was closed early or late.

#### Scenario: An end date is shown as the day covered through

- **WHEN** a lease begins 2026-01-01 for six months, so its expected end date is 2026-07-01
- **THEN** the screen conveys that the tenancy covers through 2026-06-30

#### Scenario: A recorded departure is shown as the day covered through

- **WHEN** a lease has a move-out recorded as 2026-07-05
- **THEN** the screen conveys that the tenancy covered through 2026-07-04

#### Scenario: A tenancy that ran past its agreed term

- **WHEN** a lease's move-out was recorded after its expected end date
- **THEN** both are legible: what was agreed, and what happened

### Requirement: The owner can sign a new tenancy

The application SHALL let the owner create a lease, from the leases screen and from a room that has no active lease, using the same form in both cases.

The form SHALL collect the room, the person responsible, the start date, the agreed duration, the number of people to bill for, and the deposit in months. It SHALL allow the agreed rent to be supplied, and SHALL make clear that leaving it out is a choice with a defined result — the room's current rent — not an omission.

**The opening meter reading SHALL be filled in from the room's own last known reading as soon as a room is chosen**, and SHALL remain editable. This is the figure the tenant's first electricity bill is measured from; showing it lets an owner compare it against the meter on the wall and correct it, where a default applied silently could not be checked at all. Where the room has never been let and has no recorded reading, the field SHALL be left empty and SHALL say that this room needs one — there is genuinely nothing to fall back on, and promising a default that does not exist sends an owner to meet an error they were told would not happen.

The form SHALL also let the owner narrow the rooms it offers by building, for the same reason the list does.

**The deposit SHALL be required, and zero SHALL be accepted.** Defaulting a missing value to zero would make "no deposit was taken" and "the deposit was not recorded" the same record, and only one of those is safe to act on.

A room that already has a running tenancy SHALL NOT be offered. Where the room becomes occupied between opening the form and submitting it, the refusal SHALL be reported in terms of the room being taken, not as an unexplained failure.

On success the owner SHALL be taken to the tenancy that was created, so the next thing they do — adding an occupant, checking the deposit — starts from it.

#### Scenario: Signing a tenancy from the leases screen

- **WHEN** the owner creates a lease from the leases screen
- **THEN** it is created and they are taken to it

#### Scenario: Signing a tenancy from a room

- **WHEN** the owner starts a tenancy from a room with no active lease
- **THEN** the same form is offered with that room already chosen

#### Scenario: Only vacant rooms are offered

- **WHEN** the owner opens the form and chooses a room
- **THEN** rooms that already have a running tenancy are not among the choices

#### Scenario: The room was taken in the meantime

- **WHEN** the owner submits a tenancy for a room that acquired one since the form was opened
- **THEN** they are told the room already has a running tenancy, and the form keeps what they entered

#### Scenario: A tenancy with no deposit

- **WHEN** the owner records a deposit of zero months
- **THEN** it is accepted as a deliberate zero

#### Scenario: The deposit is not left blank

- **WHEN** the owner submits without entering a deposit
- **THEN** the form asks for one rather than assuming zero

#### Scenario: The meter reading is filled in from the room

- **WHEN** the owner chooses a room that has been let before
- **THEN** the opening meter reading shows that room's last known reading, and can be changed

#### Scenario: A room with no reading to offer

- **WHEN** the owner chooses a room that has never been let
- **THEN** the opening meter reading is empty and the form says this room needs one

#### Scenario: Narrowing the rooms offered by building

- **WHEN** the owner chooses a building on the form
- **THEN** only that building's vacant rooms are offered

#### Scenario: Rent left out

- **WHEN** the owner submits without an agreed rent
- **THEN** the form has made clear what will be used instead, and the lease is created

### Requirement: The person responsible can be created while signing

The application SHALL let the owner name the person responsible by typing, offering existing customers that match as they type, and SHALL let them add somebody the list does not have without leaving the form.

Leaving the form is not a small cost: the owner loses what they have already filled in, and the tenancy they were signing has to be started again. A tenant signing their first lease is the ordinary case, so the ordinary case was the one that required a detour.

Choosing an existing person SHALL behave exactly as choosing from a list does today.

Where the owner adds a new person, a phone number SHALL be required. It is the only value the system recognises a returning tenant by, and a person recorded without one becomes a second record of the same name the next time they rent. This requirement applies where somebody is taking responsibility for a tenancy; it does not change what the customers screen asks for.

#### Scenario: Choosing somebody already on file

- **WHEN** the owner types part of a name and picks a suggestion
- **THEN** that person is the signatory, as if they had been chosen from a list

#### Scenario: Adding somebody new

- **WHEN** the owner types a name the list does not have, supplies a phone number, and signs
- **THEN** the person is created and the tenancy is signed to them, without the form being left

#### Scenario: A new person with no phone number

- **WHEN** the owner tries to add a new person without a phone number
- **THEN** the form refuses, and says why the number is needed

### Requirement: A phone number that belongs to somebody else stops the signing

Where the owner supplies a phone number that already belongs to a person on file, the application SHALL show whose it is and SHALL NOT sign the tenancy until the owner has chosen.

The system matches on the phone number and keeps the name it already holds; the typed name is discarded. Proceeding would attach the tenancy to a person whose name the owner never entered, and it is worst in the case that looks most ordinary — a returning tenant whose name is spelled slightly differently.

It cannot be caught afterwards by comparing the name returned against the name typed, because those agree precisely when the existing person happens to share the name.

The owner SHALL be able to accept the matched person and continue, or go back and change what they entered.

#### Scenario: The number belongs to a returning tenant

- **WHEN** the owner enters a name and a phone number already held by another customer
- **THEN** the screen shows who holds it and waits, rather than signing

#### Scenario: Accepting the match

- **WHEN** the owner confirms that the matched person is who they meant
- **THEN** the tenancy is signed to that person, under the name already on file

#### Scenario: The number belongs to an owner account

- **WHEN** the phone number belongs to an owner rather than a customer
- **THEN** the refusal says so, and no person is created

### Requirement: The owner can correct the terms of a running tenancy

The application SHALL let the owner change a running lease's agreed duration and the number of people it bills for.

A tenancy that has recorded a move-out SHALL NOT be editable, and the application SHALL NOT offer the action rather than offering it and reporting a refusal.

#### Scenario: Changing the agreed duration

- **WHEN** the owner changes a running lease's duration
- **THEN** it is saved, and the dates shown for the tenancy follow the new duration

#### Scenario: Changing how many people are billed for

- **WHEN** the owner changes the occupant count
- **THEN** it is saved, and bills already issued are unaffected

#### Scenario: A finished tenancy cannot be edited

- **WHEN** the owner views a lease that has recorded a move-out
- **THEN** no way to change its terms is offered

### Requirement: The number billed for and the people recorded are shown as different things

A lease's occupant count is what utility billing uses. Its occupant records are the people whose details the owner holds. The two are maintained separately and MAY legitimately differ.

The application SHALL show both, and SHALL NOT present either as a count of the other. A list of two people under a heading reading "5 occupants" reads as a screen that has lost three records; showing only the count hides who lives there; showing only the names hides what is being billed.

Adding or departing an occupant SHALL NOT change the count, and the application SHALL NOT suggest that it did.

#### Scenario: The two figures differ

- **WHEN** a lease bills for five people and has two people recorded
- **THEN** both figures are shown, and neither is presented as an error or as a count of the other

#### Scenario: Adding a person does not change what is billed

- **WHEN** the owner adds an occupant to a lease
- **THEN** the number billed for is unchanged, and the screen does not imply otherwise

### Requirement: The owner can maintain who lives in a tenancy

The application SHALL let the owner add a person to a lease, record that a person left, and see everyone who has occupied it — including those who have gone, with the dates they joined and left.

A person who has left SHALL remain visible rather than disappearing. Where somebody lived and when is the question these records exist to answer.

Adding a person who is already a current occupant SHALL be refused in those terms. Adding a person who previously left SHALL be allowed, and SHALL leave the earlier record intact.

#### Scenario: Adding a person

- **WHEN** the owner adds an existing customer to a running lease
- **THEN** they appear among its occupants with the date they joined

#### Scenario: Recording that a person left

- **WHEN** the owner records that an occupant left
- **THEN** they are shown as departed, with the date, and remain in the tenancy's history

#### Scenario: Someone who left is still shown

- **WHEN** the owner views the occupants of a lease people have left
- **THEN** both current and departed occupants are listed, each with their dates

#### Scenario: Adding the same person twice

- **WHEN** the owner adds a person who is already a current occupant
- **THEN** they are told that person is already recorded, and no second record is created

#### Scenario: Someone who left and came back

- **WHEN** the owner adds a person who previously departed the same lease
- **THEN** a new record is created and the earlier one is retained

### Requirement: Departing the responsible occupant offers the transfer it requires

Responsibility for an agreement cannot simply be dropped: where other occupants remain, the person responsible cannot be recorded as departed until responsibility has passed to one of them.

The application SHALL offer that transfer as part of departing them, rather than refusing and leaving the owner to discover what is required. A refusal that names a rule without offering the action is a screen that knows what to do and will not do it.

Where no other current occupant remains there is nobody to transfer to, and the departure SHALL be accepted — leaving a tenancy that reports no tenant until a move-out is recorded.

The application SHALL also let the owner transfer responsibility on its own, without anybody leaving.

#### Scenario: Departing the responsible occupant while others remain

- **WHEN** the owner records a departure for the person responsible for a lease and other occupants remain
- **THEN** the application asks which of them takes over, and completes both the transfer and the departure

#### Scenario: Departing the last occupant

- **WHEN** the owner records a departure for the person responsible and no other current occupant remains
- **THEN** the departure is accepted, and the tenancy reports no tenant

#### Scenario: Transferring on its own

- **WHEN** the owner transfers responsibility to another current occupant without recording a departure
- **THEN** that person becomes responsible, the previous one remains an occupant, and both are still listed

### Requirement: The tenancy screens adapt to the viewport

The leases screen and a tenancy's own screen SHALL be usable down to a phone's width, with no horizontal scrolling of the page itself. Content too wide to fit SHALL scroll within its own bounds.

#### Scenario: Tenancies on a narrow viewport

- **WHEN** the leases screen is viewed at a phone's width
- **THEN** each tenancy remains readable and the page does not scroll sideways

#### Scenario: A tenancy on a narrow viewport

- **WHEN** a tenancy's screen is viewed at a phone's width
- **THEN** its terms and its occupants remain readable, and any table too wide scrolls within itself

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

### Requirement: A tenancy shows what it has been billed

The application SHALL show, on the tenancy itself, the invoices issued against it — each with the period it covers, its amount, and whether it has been collected — together with how many have been issued and how much is still owed.

This is the question that follows every other question on this screen. An owner checking a tenancy's terms is usually checking them against a dispute about money, and today reaching that answer means leaving for the invoice list and narrowing it back down to the one tenancy they were already looking at.

The outstanding balance SHALL be stated as a figure, not left to be added up from the rows. A total the reader has to compute is a total the screen declined to give.

The list SHALL be ordered with the most recent period first, since a dispute is almost always about a recent one.

Where a tenancy has been billed more than is shown, the application SHALL say so, and SHALL state that the balance covers only what is shown. It SHALL NOT present a partial list as complete, and SHALL NOT offer a route that answers a different question in its place — the invoice screen narrows by room, and a room outlives its tenancies, so a previous tenant's bills shown as this agreement's history is worse than showing fewer.

An invoice SHALL be reachable from its row, so the charge behind an amount can be read without going through the invoice list.

#### Scenario: A tenancy with invoices

- **WHEN** the owner opens a lease that has been billed
- **THEN** its invoices are listed newest period first, each showing the period, the amount, and whether it is collected

#### Scenario: The balance is stated

- **WHEN** a tenancy has invoices, some collected and some not
- **THEN** the screen states how many invoices exist and how much is still owed, without the reader adding anything up

#### Scenario: A tenancy that has never been billed

- **WHEN** the owner opens a lease with no invoices
- **THEN** the screen says so plainly, rather than showing an empty area that reads as a panel that failed to load

#### Scenario: Reaching the charges behind an amount

- **WHEN** the owner opens one of the listed invoices
- **THEN** that invoice is shown in full

#### Scenario: More history than is shown

- **WHEN** a tenancy has more invoices than the panel lists
- **THEN** the screen says how many of how many it is showing, and says the balance covers only those — rather than presenting what it shows as all of it

### Requirement: The contract is reported as present or absent, never as a location

The application SHALL report only WHETHER a signed contract is on file, and SHALL NOT display the file's storage location, its name as stored, or any address derived from it.

Every link to a contract is signed at the moment it is requested. A stored location on screen would therefore be an address that cannot be opened, and one more thing to leak.

Where this deployment cannot store contracts at all, the screen SHALL say the storage is unconfigured rather than offering an upload that is certain to fail.

The screen SHALL state the size limit an upload is actually held to, so the limit is learned before a large file is chosen rather than after it is rejected.

#### Scenario: A contract is on file

- **WHEN** the owner opens a lease whose contract has been uploaded
- **THEN** the screen says one is on file and offers to view or replace it, without showing where it is stored

#### Scenario: No contract yet

- **WHEN** the owner opens a lease with no contract uploaded
- **THEN** the screen says so and offers to upload one, stating the size limit and the accepted formats

#### Scenario: Storage is not configured

- **WHEN** the deployment has no contract storage configured
- **THEN** the screen says so, and does not offer an upload
