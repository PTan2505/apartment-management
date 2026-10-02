## ADDED Requirements

### Requirement: The owner records a repair's cost from the report itself

The damage report screen SHALL let the owner record what a repair cost, on the report it
belongs to, and SHALL show the figure on the report afterwards.

It belongs on the report rather than on the expenses screen because that is where the
owner is when they learn the number: the person who did the work writes it in the
closing note the report already asks for, and the owner reads it there. Making them copy
a room, a building and a date onto a blank expense form is how the cost stops being
recorded at all.

The form SHALL state plainly that this is the OWNER's cost, not something billed to the
tenant, and SHALL default its date to the day the report was closed.

A report with no cost SHALL say so rather than showing nothing, because "nobody has
priced this yet" is the state the owner is scanning for.

Only the owner SHALL be offered the control. Staff who can read the report SHALL see the
figure once it exists.

#### Scenario: The owner costs a repair

- **WHEN** the owner records a cost on a closed report
- **THEN** the report shows the amount without a reload, and the building's expenses include it

#### Scenario: A report nobody has priced

- **WHEN** the owner reads a closed report with no cost recorded
- **THEN** it says so, and offers to record one

#### Scenario: Correcting it

- **WHEN** the owner changes a cost already recorded
- **THEN** the report shows the new figure and no second expense appears

#### Scenario: Maintenance reads a costed report

- **WHEN** a maintenance account opens a report in a building it covers that has been costed
- **THEN** the amount is shown, and nothing offers to record or change it

## MODIFIED Requirements

### Requirement: A control the signed-in role may not use is not shown

Where a role may not perform an action, the application SHALL NOT offer the control for
it. A button that answers with a refusal teaches the person nothing except that the
software is unreliable: they cannot tell a permission they do not have from a fault they
should report.

This SHALL apply to the controls a manager has lost: editing, retiring and restoring a
building or a room, adding a room, correcting a tenancy's terms or its occupant count,
recording a payment against an invoice, withdrawing an invoice, reversing a payment,
and now writing an EXPENSE — adding one, correcting one, deleting one, and recording a
vacant room's electricity.

Hiding a control SHALL NOT hide the information beside it. A manager still sees a room's
rent, a tenancy's terms, an invoice's total and what it still owes, and the whole expense
list for the buildings they cover — they may not change those figures, and they still
have to work from them.

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

#### Scenario: A manager reads the expenses

- **WHEN** a manager opens the expenses of a building they cover
- **THEN** every expense is listed with its amount and category, and nothing offers to add, correct or delete one, nor to record a vacant room's electricity

#### Scenario: A manager reads a costed repair

- **WHEN** a manager opens a damage report the owner has costed
- **THEN** the amount is shown, and nothing offers to change it
