# web-staff Specification

## Purpose

The screens the two staff roles work from, and the owner's screen for issuing their
accounts.

Two rules run through all of it. Each role arrives where its work is and is offered only
that — a destination that will refuse somebody is worse than no destination, because
they cannot tell a permission from a fault. And a control a role may not use is not
drawn at all, though nothing they may READ is ever hidden with it: a manager quotes the
rent they cannot change, and chases the invoice they cannot settle.

## Requirements
### Requirement: The application says a report has arrived, as it arrives

The shell SHALL show how many unread notices the signed-in account has, and
SHALL update that number when one arrives, without a reload and without the
person having to be on the report screen.

Arrival SHALL also be announced once, briefly, naming the room — a number that
changes in the corner of a screen nobody is looking at is not an announcement.

Selecting it SHALL show the notices themselves — what arrived, which room, and
when — and reading them SHALL be what clears the count. Selecting one SHALL open
the report it announces, whatever state that report is now in.

A notice for a report that has since been dealt with SHALL say so rather than
disappearing. It is a record of something that happened, and a list that erases
what was handled cannot answer "was anything reported while I was away".

Where the connection is not available — refused, dropped, or never established
— the count SHALL still be correct on arriving at a screen and SHALL be
refreshed periodically. The live connection makes it immediate; it is not what
makes it right.

#### Scenario: A report arrives while the staff member is elsewhere

- **WHEN** a tenant raises a report while a manager is reading a tenancy
- **THEN** the count rises, and a brief notice names the room

#### Scenario: Reading the notices

- **WHEN** they open the list of notices
- **THEN** the notices are shown newest first, and the count returns to zero

#### Scenario: A notice for a report already dealt with

- **WHEN** a notice announces a report that has since been closed
- **THEN** it is still listed, marked as dealt with, and still opens that report

#### Scenario: The connection is unavailable

- **WHEN** the live connection cannot be established
- **THEN** the count is still shown correctly and refreshes as the person moves around the application

#### Scenario: The session ends

- **WHEN** the person signs out
- **THEN** the connection is closed and no further notice appears

### Requirement: The owner manages staff from a screen of their own

The application SHALL give an `owner` a screen listing staff accounts with, for
each, the person's name and phone number, their role, the buildings they cover,
and whether the account can still sign in.

The screen SHALL be reachable only by an owner, and SHALL NOT appear in the
navigation for any other role.

Creating an account SHALL ask for a name, a phone number and a role, and nothing
else. The password is the system's to generate.

#### Scenario: Seeing the staff

- **WHEN** the owner opens the staff screen
- **THEN** each account is listed with its role, its buildings and whether it is active

#### Scenario: Not offered to staff

- **WHEN** a manager or maintenance account is signed in
- **THEN** the staff screen is neither shown in the navigation nor reachable by its address

#### Scenario: Creating an account

- **WHEN** the owner creates a manager with a name and phone number
- **THEN** the account appears in the list

### Requirement: The generated password is shown once, and said to be shown once

On creating an account or resetting its password, the application SHALL show the
generated password, offer to copy it in one action, and state plainly that it
will not be shown again.

It SHALL NOT be shown anywhere else afterwards — not on the list, not on the
account, not after a reload.

#### Scenario: After creating

- **WHEN** an account has just been created
- **THEN** the password is on screen, copyable, with a line saying it cannot be shown again

#### Scenario: After a reload

- **WHEN** the owner reloads the screen
- **THEN** the password is gone, and the account reads as any other

#### Scenario: Forgotten

- **WHEN** the owner resets a staff member's password
- **THEN** a new one is shown once, the same way, with the same warning

### Requirement: Buildings are assigned from the same screen

The application SHALL let the owner change which buildings a staff account
covers, showing what they cover now.

An account covering no buildings SHALL say so rather than showing an empty
space: a manager assigned to nothing sees nothing, which reads as a broken
screen to whoever is holding it.

Deactivating an account SHALL confirm first, and SHALL say what it does — the
person can no longer sign in, and any session they have open stops working.

#### Scenario: Assigning

- **WHEN** the owner assigns a building to a manager
- **THEN** it appears among the buildings that manager covers

#### Scenario: Covering nothing

- **WHEN** a staff account has no buildings
- **THEN** the screen says so, and says what it means for that person

#### Scenario: Deactivating

- **WHEN** the owner deactivates an account and confirms
- **THEN** it is marked as unable to sign in, and the screen says so

### Requirement: Damage reports have a screen the building's staff work from

The application SHALL give staff and the owner a screen listing damage reports,
oldest open first, each showing the room and building, what the tenant said,
when it was raised, its state, and the appointment where one has been agreed.

It SHALL be filterable by state, and by building for anyone covering more than
one.

Opening a report SHALL show the tenant's name and phone number, so the person
handling it can ring them from what is in front of them.

#### Scenario: What a maintenance worker sees on arrival

- **WHEN** a maintenance account signs in
- **THEN** the damage reports of its buildings are the screen it arrives at, oldest open first

#### Scenario: Reaching the tenant

- **WHEN** staff open a report
- **THEN** the tenant's name and phone number are shown with it

#### Scenario: Nothing outstanding

- **WHEN** no report is open
- **THEN** the screen says so rather than showing an empty list

### Requirement: Staff record the appointment and close the report

The screen SHALL let staff record the date and time agreed with the tenant, with
a note of what was agreed, and SHALL show that appointment on the report
afterwards.

It SHALL let them close a report with a note of what was done, from either
state, and SHALL confirm before closing — a closed report cannot be reopened.

A report that is done SHALL offer neither action, and SHALL say when it was
closed and what was done.

#### Scenario: Recording an appointment

- **WHEN** staff record an appointment on a new report
- **THEN** the report shows it as scheduled, with that date

#### Scenario: Closing

- **WHEN** staff close a report and confirm
- **THEN** it reads as done, with the note and the date it was closed

#### Scenario: A closed report

- **WHEN** staff open a report that is done
- **THEN** no action is offered, and the closing note is shown

### Requirement: Each role arrives where its work is, and is offered only that

The application SHALL send each role to its own starting screen — the owner to
buildings, a manager to tenancies, maintenance to damage reports — and SHALL
show in the navigation only what that role may reach.

For the `owner` that is everything: every screen this application has, including
the damage reports and the staff screen. Filtering the navigation by role must
not become a way for a screen to go missing from the one account that is meant
to see all of them.

A manager's navigation SHALL NOT carry the revenue report or the staff screen.
Offering a destination that will refuse the person is worse than not offering
it: they cannot tell a permission from a fault.

Where a role's data is narrowed to its buildings, the screen SHALL say which
buildings those are, so a short list reads as a scope rather than as missing
records.

#### Scenario: A manager signs in

- **WHEN** a manager signs in
- **THEN** they arrive at the tenancy list, narrowed to their buildings, with the buildings they cover named

#### Scenario: What a manager is not offered

- **WHEN** a manager reads the navigation
- **THEN** it carries no revenue report and no staff screen

#### Scenario: Maintenance signs in

- **WHEN** a maintenance account signs in
- **THEN** it arrives at the damage reports, and the navigation offers nothing else

#### Scenario: The owner is offered everything

- **WHEN** the owner reads the navigation
- **THEN** it carries every screen in the application, including the damage reports, and nothing is hidden from them

#### Scenario: Typing an address they may not reach

- **WHEN** a manager navigates directly to the revenue report
- **THEN** the application says the screen is not theirs and offers the way back, rather than showing a failed request

### Requirement: A control the signed-in role may not use is not shown

Where a role may not perform an action, the application SHALL NOT offer the control for
it. A button that answers with a refusal teaches the person nothing except that the
software is unreliable: they cannot tell a permission they do not have from a fault they
should report.

This SHALL apply to the controls a manager has lost: editing, retiring and restoring a
building or a room, adding a room, correcting a tenancy's terms or its occupant count,
recording a payment against an invoice, withdrawing an invoice, and reversing a payment.

Hiding a control SHALL NOT hide the information beside it. A manager still sees a room's
rent, a tenancy's terms, an invoice's total and what it still owes — they may not change
those figures, and they still have to work from them.

Where hiding a control would leave a row, a card or a menu with nothing in it, that
container SHALL be absent rather than empty.

#### Scenario: A manager reads a room list

- **WHEN** a manager opens the rooms of a building they cover
- **THEN** every room is listed with its rent, and no row offers to edit, retire or restore it, and nothing offers to add one

#### Scenario: A manager reads a tenancy

- **WHEN** a manager opens a tenancy in a building they cover
- **THEN** its rent, rates, deposit and occupant count are shown, and nothing offers to correct them

#### Scenario: A manager reads an invoice that is owed

- **WHEN** a manager opens an unpaid invoice
- **THEN** it shows what is charged and what is owed, and offers neither to record a payment nor to withdraw it

#### Scenario: A manager reads an invoice that was paid

- **WHEN** a manager opens an invoice that has a recorded payment
- **THEN** the payment is shown with its date and amount, and nothing offers to reverse it

#### Scenario: The owner is unaffected

- **WHEN** the owner opens any of those screens
- **THEN** every control is present, exactly as before

#### Scenario: An empty menu is not shown

- **WHEN** a manager reads a row whose every action has been hidden
- **THEN** the row shows no actions menu at all, rather than one that opens onto nothing

### Requirement: A manager signs a tenancy on the owner's figures, and can see them

When a manager signs or renews a tenancy, the form SHALL show the rent, electricity rate,
water rate and deposit months it will be created with, taken from the room and its
building, and SHALL NOT let the manager change them.

Showing them read-only rather than omitting them is the point: a manager is quoting these
figures to the person signing, and a form that hides them would send them to a different
screen to read what they are about to agree to.

The form SHALL say where each figure comes from, so a manager who believes one is wrong
knows it is the owner who changes it and not them.

For the owner the same fields SHALL remain editable, and the explanation of the room's
and building's figures that is already there SHALL be unchanged.

#### Scenario: A manager opens the tenancy form

- **WHEN** a manager begins signing a tenancy for a room
- **THEN** the rent, both rates and the deposit are filled from the room and its building, shown, and not editable

#### Scenario: A manager is told whose figures they are

- **WHEN** a manager reads those fields
- **THEN** the form says they come from the room and the building and are the owner's to change

#### Scenario: A manager renews a tenancy

- **WHEN** a manager renews a tenancy
- **THEN** the rent and deposit of the renewal are shown, filled from the room and the predecessor, and not editable

#### Scenario: The owner renegotiates a deposit at renewal

- **WHEN** the owner renews a tenancy and changes the months of deposit the successor takes
- **THEN** the field accepts it, the shortfall or surplus shown beside it is recalculated from the new figure, and the confirmation names the change rather than promising the deposit is unchanged

#### Scenario: A deposit that is not a whole number of months

- **WHEN** the owner types a fractional or negative deposit on the renewal form
- **THEN** the form says so and renewal cannot be submitted

#### Scenario: The owner still negotiates

- **WHEN** the owner signs a tenancy
- **THEN** every one of those fields is editable, and overriding one still works

