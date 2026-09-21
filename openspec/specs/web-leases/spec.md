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

Every tenancy date SHALL be labelled by what it is to the owner — the first day lived there, the last day the agreement covers, the day the room was handed back — and not by a word that leaves the reader to work out which boundary is meant.

Where a tenancy has ended, the application SHALL show the day the room was handed back and the last day it covered, together. The handed-back day is the date owner and tenant actually agree on; the last day covered is the one billing and the next tenancy depend on. Showing only one leaves the reader to compute the other, and showing them in different places on one screen reads as two dates that disagree by a day.

The application SHALL distinguish a tenancy handed back before its agreed term ended, on the day it ended, and after it ended. An early departure SHALL NOT be described in words that also describe an on-time one.

#### Scenario: An end date is shown as the day covered through

- **WHEN** a lease begins 2026-01-01 for six months, so its expected end date is 2026-07-01
- **THEN** the screen conveys that the tenancy covers through 2026-06-30

#### Scenario: A recorded departure is shown as the day covered through

- **WHEN** a lease has a move-out recorded as 2026-07-05
- **THEN** the screen conveys that the room was handed back on 2026-07-05 and that the tenancy covered through 2026-07-04, together

#### Scenario: A tenancy that ran past its agreed term

- **WHEN** a lease's move-out was recorded after its expected end date
- **THEN** both are legible: what was agreed, and what happened, and it reads as having stayed past the agreement

#### Scenario: A tenancy handed back early

- **WHEN** a lease's move-out was recorded before its expected end date
- **THEN** it reads as handed back before the agreement ended, not as within the term

#### Scenario: A tenancy handed back on the day its agreement ended

- **WHEN** a lease's move-out date equals its expected end date
- **THEN** it reads as handed back on time

#### Scenario: Every date says what it is

- **WHEN** the owner reads the dates on a tenancy
- **THEN** each label names what the date is — the first day lived there, the last day the agreement covers, or the day the room was handed back

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

### Requirement: The agreed terms of a tenancy are readable on it

The application SHALL show, on a tenancy, the terms the agreement was made on: its reference, and the date the paper contract was signed.

These are the answers an owner is asked for by a tenant or needs in a dispute, and the tenancy is the only record that holds them.

The notice period, the payment day and the opening water reading SHALL NOT be shown, because the system no longer holds them. Each was written and read by nothing: no move-out consulted the notice, no invoice carried a due date from the payment day, and water is billed per occupant rather than by meter. The water reading was the costliest of the three to show — beside an electricity reading that every invoice consumes, a second meter-looking number reads as another billed meter, and someone would eventually reconcile a water bill against a figure nothing had ever added.

Where the signing date has not been recorded, the screen SHALL say so rather than leave the space blank. A blank is read as a screen that failed rather than as a fact about the tenancy.

Each row of terms SHALL be laid out across the width of the card rather than bunched at one edge, so one fact is separated from the next.

#### Scenario: Reading the terms

- **WHEN** the owner opens a tenancy whose terms have been recorded
- **THEN** the reference and the signing date are shown

#### Scenario: A term that was never recorded

- **WHEN** a tenancy has no signing date
- **THEN** the screen says it has not been recorded, rather than showing an empty space

#### Scenario: The retired terms are nowhere on the screen

- **WHEN** the owner opens any tenancy
- **THEN** no notice period, payment day or opening water reading appears on it

#### Scenario: A tenancy that was renewed

- **WHEN** the owner opens a tenancy created by renewing another
- **THEN** its reference is shown like any other tenancy's, not as an empty space

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

### Requirement: The signing form takes both sides of the tenant's ID card
The form that signs a tenancy SHALL offer to attach a photograph of each side of the signatory's ID card, and SHALL attach them to the person the tenancy is signed for.

The images SHALL be optional: a tenancy can be signed without them, because the owner may not have the card to hand.

Where the signatory is a person already on file, choosing new images SHALL replace what that person had, and choosing none SHALL leave what they had alone.

Chosen images SHALL be shown before the form is submitted, so the owner can see they picked the right photographs and the right way round.

If a tenancy is created and its images then fail to upload, the screen SHALL say so plainly and SHALL NOT imply the tenancy failed — the tenancy exists, and the images can be attached again from the tenancy's own page.

#### Scenario: Signing with both sides
- **WHEN** the owner chooses a front and a back and signs the tenancy
- **THEN** the tenancy is created and its signatory carries both images

#### Scenario: Signing without them
- **WHEN** the owner signs a tenancy without choosing any image
- **THEN** the tenancy is created and the signatory's images are unchanged

#### Scenario: The upload fails after the tenancy is created
- **WHEN** the tenancy is created and an image upload then fails
- **THEN** the screen says the tenancy was created and the images were not attached

### Requirement: A tenancy's page shows the ID card on file for its signatory
The tenancy page SHALL show whether its signatory has each side of their ID card on file, and SHALL allow each side to be viewed, replaced or removed.

Viewing SHALL open the image through the short-lived signed link the API issues, rather than embedding a permanent address.

#### Scenario: Both sides on file
- **WHEN** the owner opens a tenancy whose signatory has both sides on file
- **THEN** the page shows both as present and offers to view each

#### Scenario: Nothing on file
- **WHEN** the owner opens a tenancy whose signatory has no images
- **THEN** the page says so and offers to attach each side

#### Scenario: Removing a side
- **WHEN** the owner removes one side from the tenancy page
- **THEN** that side is no longer on file and the other is unaffected

### Requirement: The signing form can attach the signed contract too
The form that signs a tenancy SHALL offer to attach the signed contract, and SHALL attach it to the tenancy it creates.

It SHALL be optional, SHALL show which file was chosen and how large it is before the form is submitted, and SHALL accept the same file kinds the tenancy's own contract card accepts.

A contract that fails to upload SHALL be reported alongside any ID card that failed, in the same terms: the tenancy exists, these files did not attach, and here is the way to the page that can attach them.

#### Scenario: Signing with the contract attached
- **WHEN** the owner chooses a contract file and signs the tenancy
- **THEN** the tenancy is created carrying that contract

#### Scenario: Signing without one
- **WHEN** the owner signs without choosing a contract
- **THEN** the tenancy is created with no contract, and no error is shown

#### Scenario: The contract fails to upload
- **WHEN** the tenancy is created and the contract upload then fails
- **THEN** the screen says the tenancy was created and names the contract among what did not attach

### Requirement: The tenancy's rates can be corrected from its terms dialog
The screen that corrects a running tenancy's terms SHALL offer its electricity and water rates, filled with what the tenancy currently records, and SHALL say that the change applies to this tenancy alone and leaves invoices already issued as they are.

#### Scenario: Owner corrects a rate
- **WHEN** the owner opens a running tenancy's terms and changes its electricity rate
- **THEN** the tenancy is saved with the new rate, and the building's rate is unchanged

#### Scenario: The fields open filled
- **WHEN** the owner opens the terms dialog
- **THEN** both rate fields show what the tenancy is currently billed at

### Requirement: Choosing a room fills what that room already answers
On the form that signs a tenancy, choosing a room SHALL fill the agreed rent with that room's rent, the opening meter reading with the room's latest known reading, and the electricity and water rates with its building's, rather than leaving them blank beside a note explaining what an empty field would mean.

Both SHALL remain editable, because either may be agreed differently for a particular tenant, and choosing a different room SHALL fill them again from that room.

#### Scenario: Choosing a room
- **WHEN** the owner chooses a room on the tenancy form
- **THEN** the agreed rent shows that room's rent, the opening reading shows its latest known reading, and both rate fields show its building's rates

#### Scenario: Signing at a rate of this tenancy's own
- **WHEN** the owner edits a filled-in rate and signs
- **THEN** the tenancy records the edited rate and the building's rate is unchanged

#### Scenario: Changing the room
- **WHEN** the owner then chooses a different room
- **THEN** both fields are filled again from the newly chosen room

#### Scenario: The figures can still be overridden
- **WHEN** the owner edits the filled-in rent
- **THEN** the tenancy is signed at the edited figure

### Requirement: The tenancies screen offers the blank contract template
The tenancies screen SHALL show whether a blank contract template is on file, and SHALL offer to download it, replace it, or remove it.

Where one is on file it SHALL name the file and say when it was uploaded, so the owner can tell the current one from the copy on their own machine.

Where none is on file it SHALL say so and offer to upload one, rather than showing nothing.

It SHALL sit above the list of tenancies and SHALL NOT crowd it: this is a thing consulted occasionally, not the screen's subject.

#### Scenario: A template on file
- **WHEN** the owner opens the tenancies screen with a template on file
- **THEN** it names the file and offers to download, replace or remove it

#### Scenario: No template yet
- **WHEN** the owner opens the tenancies screen with no template on file
- **THEN** it says so and offers to upload one

#### Scenario: Downloading to print
- **WHEN** the owner downloads the template
- **THEN** the file arrives under its original name

#### Scenario: Phone width
- **WHEN** the owner opens the tenancies screen at phone width
- **THEN** the template section fits without the page scrolling sideways

### Requirement: A change to a tenancy's rates is confirmed before it is saved

The application SHALL ask the owner to confirm saving a tenancy whose electricity or water rate has changed, showing each changed rate as its previous value and its new one.

The confirmation SHALL say that invoices already issued keep the rates recorded on them, and that the new rate applies to billing from now on. A tenancy is billed at its own copies of the rates, so changing them here is the one place an owner can move what a running tenancy is charged — and the reach of that change is the thing they cannot see from the form.

Saving a tenancy whose rates are unchanged SHALL NOT be confirmed, however many other terms were edited.

#### Scenario: Saving a changed rate

- **WHEN** an owner changes a tenancy's electricity or water rate and saves
- **THEN** a confirmation lists each changed rate as old and new, and nothing is sent until it is confirmed

#### Scenario: Saving other terms

- **WHEN** an owner changes a tenancy's notice period, payment day or handover details but neither rate
- **THEN** the change is saved without a confirmation step

#### Scenario: The confirmation says what is not affected

- **WHEN** an owner is asked to confirm a changed rate
- **THEN** the confirmation says invoices already issued keep the rates recorded on them

#### Scenario: Declining keeps the form

- **WHEN** an owner declines the confirmation
- **THEN** the form is still open with the rates they entered, and nothing was sent

### Requirement: The signing date can be entered where it is reported missing

The application SHALL let the owner supply the date the paper contract was signed, both when a tenancy is signed and afterwards when correcting its terms.

Asking at signing is the point: that is the moment the owner has the paper in front of them, and a field that can only be filled in later is filled in never. It SHALL be optional in both places — a tenancy recorded from an old paper file may have no date anyone remembers.

The reference SHALL NOT be editable. It is generated and never accepted from a caller: a typed reference drifts, and two tenancies sharing one makes both unfindable.

#### Scenario: The signing date is asked for at signing

- **WHEN** the owner signs a new tenancy and enters the date the paper contract was signed
- **THEN** the tenancy records it and shows it

#### Scenario: Signing without the paper date

- **WHEN** the owner signs a tenancy without entering that date
- **THEN** the tenancy is created and the date is reported as not recorded

#### Scenario: Recording it afterwards

- **WHEN** the owner enters the signing date on a tenancy that had none
- **THEN** it is saved and the tenancy shows it

#### Scenario: The reference is not offered for editing

- **WHEN** the owner edits the terms of a tenancy
- **THEN** the reference is not among the fields they can change

### Requirement: A tenancy shows where it came from and what it became

Where a tenancy was created by renewing another, the screen SHALL say so and SHALL name the earlier agreement. Where a tenancy has been renewed, it SHALL name the one that followed it.

Each SHALL be a link to that tenancy, and SHALL be named by the agreement's reference rather than by its record id. "Gia hạn từ #266" sends the reader away to find out what #266 was; the reference is what they recognise.

Unlike the other terms, an absent link SHALL NOT be reported at all. A tenancy that was signed rather than renewed is not missing a predecessor, and a row saying it has not been recorded would send the owner looking for one that never existed.

#### Scenario: Reading a renewed tenancy

- **WHEN** the owner opens a tenancy created by renewing another
- **THEN** it names the earlier agreement, and following that name opens it

#### Scenario: Reading the tenancy that was renewed

- **WHEN** the owner opens a tenancy that has since been renewed
- **THEN** it names the agreement that followed it, and following that name opens it

#### Scenario: A tenancy with no renewal on either side

- **WHEN** the owner opens a tenancy that was signed and has not been renewed
- **THEN** neither link appears, and nothing says a link has not been recorded

### Requirement: Departing an occupant hands over responsibility with it

Where the person leaving is the one responsible for the agreement and other occupants remain, the screen SHALL ask which of them takes over, and SHALL send the handover together with the departure as one operation.

The screen already knows who the others are. Reporting a refusal and stopping would be a screen that knows exactly what to do and declines to do it. Sending two requests would be worse than either: the handover can land while the departure fails, leaving the agreement in somebody else's name with the previous holder still living there.

The choices offered SHALL be the current occupants other than the person leaving.

The screen SHALL NOT offer to record a departure for the ONLY current occupant. There is nobody to hand the agreement to and nothing the departure could mean except ending the tenancy, which has its own action — so the screen SHALL point at that action rather than offering one that will be refused.

#### Scenario: Handing over while recording a departure

- **WHEN** the owner records the departure of the responsible occupant and chooses who takes over
- **THEN** that person becomes responsible and the departure is recorded

#### Scenario: The choices are the people who remain

- **WHEN** the owner is asked who takes over
- **THEN** the current occupants other than the person leaving are offered, and nobody else

#### Scenario: Departing somebody who is not responsible

- **WHEN** the owner records the departure of an occupant who is not the one responsible
- **THEN** no handover is asked for

#### Scenario: The only occupant is not offered the action

- **WHEN** the owner opens a tenancy with exactly one current occupant
- **THEN** no departure action is offered for that person, and the screen says that ending the tenancy is what applies

#### Scenario: Transferring on its own

- **WHEN** the owner transfers responsibility to another current occupant without recording a departure
- **THEN** that person becomes responsible, the previous one remains an occupant, and both are still listed

#### Scenario: A refusal is reported

- **WHEN** the API refuses a departure
- **THEN** the reason it gave is shown and the occupant list is unchanged

### Requirement: The contract is shown as the pages it is

The application SHALL show a tenancy's contract pages as images, in order, and SHALL let the owner open one full size.

The pages ARE the information. "Đã có bản scan trên hệ thống" beside a button asks the owner to take the contract on trust and click to find out what it says, and a phone photograph is unreadable at thumbnail size — which is why opening one full size is part of this, exactly as it is for the ID card.

The application SHALL let several pages be chosen and uploaded in one go, SHALL let further pages be added later, and SHALL let any single page be removed without disturbing the others.

The application SHALL NOT display a page's storage location, its name as stored, or any address derived from it. Every link is signed at the moment it is requested, so a stored location on screen would be an address that cannot be opened, and one more thing to leak.

Where this deployment cannot store files at all, the screen SHALL say the storage is unconfigured rather than offering an upload that is certain to fail.

The screen SHALL state the size limit and that photographs are what it takes, before a file is chosen rather than after it is refused.

Removing a page SHALL be confirmed first, naming what is about to be lost.

#### Scenario: Reading a contract

- **WHEN** the owner opens a tenancy whose contract pages have been uploaded
- **THEN** the pages are shown as images in the order they were added, without showing where they are stored

#### Scenario: Opening a page

- **WHEN** the owner opens one page
- **THEN** it is shown full size

#### Scenario: Uploading several at once

- **WHEN** the owner chooses three photographs in one go
- **THEN** all three are attached, and the screen reports progress while they upload

#### Scenario: Adding a page later

- **WHEN** the owner adds another photograph to a tenancy that already has pages
- **THEN** it joins them rather than replacing them

#### Scenario: Removing one page

- **WHEN** the owner removes one page and confirms
- **THEN** that page is gone and the others remain

#### Scenario: No pages yet

- **WHEN** the owner opens a tenancy with no contract pages
- **THEN** the screen says so and offers an upload, stating the size limit and that photographs are what it accepts

#### Scenario: Storage is not configured

- **WHEN** the deployment has no storage configured
- **THEN** the screen says so, and does not offer an upload

#### Scenario: One page fails among several

- **WHEN** three pages are uploaded and one fails
- **THEN** the screen says which failed, the other two are attached, and the tenancy is not left claiming pages it does not have

### Requirement: An occupant's departure reads the same way as the tenancy's

The application SHALL show an occupant's departure as the day they left — the first day they no longer lived there — named so that it reads in the same convention as the day a tenancy's room was handed back.

When a tenancy ends, every remaining occupant is recorded as leaving on the handed-back day. The two dates are the same day, and the screen SHALL make them read as the same day rather than as a last-day-covered beside a first-day-gone.

Where the owner records a departure, the application SHALL say which day it is asking for, and every sentence in that dialog SHALL be Vietnamese.

#### Scenario: Occupants who left when the room was handed back

- **WHEN** the owner views an ended tenancy whose occupants left at move-out
- **THEN** each occupant's departure day and the tenancy's handed-back day are the same date under matching wording

#### Scenario: Recording a departure

- **WHEN** the owner opens the dialog to record that somebody left
- **THEN** it explains that the date is the first day that person no longer lives there, and no sentence in it is in English

### Requirement: The owner can renew a tenancy from its screen

The application SHALL offer, on a running tenancy, an action that renews it: closing it on its agreed end date and opening a successor beginning that day, in one operation.

Without it the owner reaches the same outcome by recording a move-out and signing a new tenancy — which re-enters the occupants by hand, settles the deposit and collects it again, re-chooses the service fees, leaves the days between the two uncovered, and records no link between the agreements. A renewal is one operation in the API and SHALL be one action on the screen.

The application SHALL ask only for what a renewal genuinely needs: the closing meter reading and the length of the new term. Everything the successor inherits — its start date, its occupants, its deposit, its service fees — SHALL be shown rather than asked for again.

The agreed rent SHALL be offered with the ROOM's current rent filled in, and SHALL be changeable. A renewal is where a price rise takes effect; carrying the old rent forward silently would make a rise unenforceable for as long as a tenant keeps renewing.

Where the deposit the successor requires differs from what is already held, the application SHALL say so before the renewal is confirmed, and SHALL let the owner either charge the difference on the successor's first invoice or leave it to be settled in cash.

The application SHALL state, before the owner confirms, that the predecessor will be closed with a final bill for its last month and the successor opened with its move-in bill. These are invoices the owner will be answering for, and meeting them afterwards is meeting them too late.

The action SHALL NOT be offered on a tenancy that has recorded a move-out or been cancelled. Its tenancy is closed, and its successor, if any, exists already.

On success the application SHALL take the owner to the successor.

#### Scenario: Renewing a running tenancy

- **WHEN** the owner renews a tenancy, supplying the closing meter reading and a term
- **THEN** the predecessor is closed on its agreed end date, a successor begins that day, and the owner is taken to the successor

#### Scenario: What the successor inherits is shown, not asked

- **WHEN** the owner opens the renewal dialog
- **THEN** the start date, the occupants carried over, and the service fees at their current prices are shown without being asked for

#### Scenario: The rent comes from the room and can be changed

- **WHEN** the owner opens the renewal dialog for a room whose rent has since risen
- **THEN** the room's current rent is filled in, and the owner can change it before confirming

#### Scenario: A deposit that no longer matches

- **WHEN** the renewal requires a larger deposit than is held
- **THEN** the dialog says so and offers to charge the difference on the successor's first invoice or to settle it in cash

#### Scenario: The bills are named before confirming

- **WHEN** the owner is about to confirm a renewal
- **THEN** the dialog says the predecessor's final bill and the successor's move-in bill will be issued

#### Scenario: Not offered where it cannot apply

- **WHEN** the owner opens a tenancy that has recorded a move-out or been cancelled
- **THEN** no renewal action is offered

#### Scenario: A refusal is reported

- **WHEN** the API refuses a renewal
- **THEN** the reason it gave is shown in the dialog, the dialog stays open, and neither tenancy is changed

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

