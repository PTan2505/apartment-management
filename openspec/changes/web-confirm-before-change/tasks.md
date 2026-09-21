## 1. Shared pieces

- [x] 1.1 `ConfirmDialog`: question, consequence, cancel, a confirm labelled by its action, destructive colour, busy state, and an error shown inside the dialog
- [x] 1.2 `ChangedAmounts`: renders only the figures that differ, compared numerically, formatted like money is formatted everywhere else

## 2. Actions that send on click today

- [x] 2.1 Reversing a payment — naming the amount, the date received, and that the invoice returns to unpaid
- [x] 2.2 Removing an ID-card photo, front and back
- [x] 2.3 Removing the contract template
- [x] 2.4 Replacing a file: ID-card photo, signed contract scan, contract template — asked after the file is chosen, before anything is sent, and the file input cleared when declined
- [x] 2.5 Restoring a building, and restoring a room

## 3. Forms that change money

- [x] 3.1 Building: electricity and water rates, with what the new rate applies to
- [x] 3.2 Room: rent, with what the new rent applies to
- [x] 3.3 Cost: amount (a measured cost's quantity and rate are not editable once recorded)
- [x] 3.4 Tenancy terms: electricity and water rates, saying issued invoices keep their own
- [x] 3.5 Forms with no money change still save directly — customer details, occupant count, and any of the above saved without touching a figure

## 4. Strings

- [x] 4.1 Every new Vietnamese string collected and reported for review, none changed silently

## 5. Checks

- [x] 5.1 `tsc --noEmit`, lint, both builds

## 6. Verify in a visible browser

- [x] 6.1 Each confirmed action: declining sends nothing — read back that the record, file or figure is unchanged
- [x] 6.2 Each confirmed action: confirming does exactly what it said
- [x] 6.3 A form saved with no money change still saves with no dialog
- [x] 6.4 A form saved with a money change lists exactly the changed figures, old and new
- [x] 6.5 Declining a form's confirmation leaves the form open with the entered values
- [x] 6.6 A refusal is reported in the dialog, and the screen is not dismissed
- [x] 6.7 390px
- [x] 6.8 A refusal mid-flight: the message lands in the dialog, the dialog stays open, nothing changed
