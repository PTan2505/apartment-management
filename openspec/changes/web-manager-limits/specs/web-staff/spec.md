## ADDED Requirements

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
