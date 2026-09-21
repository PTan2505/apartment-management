## ADDED Requirements

### Requirement: The billed count can be corrected where it is read

The application SHALL offer, beside the number of people a running tenancy is billed for, a control that edits that number and nothing else.

An owner notices the count is wrong at the moment they read it. Sending them to a dialog elsewhere on the page, opened on a different field among several, is where a correction turns into a change to the wrong number.

The control SHALL NOT be offered on a tenancy that has ended or was cancelled, because the update would be refused and a control that cannot work is worse than none.

Saving SHALL change only the billed count. It SHALL NOT change the recorded occupants, and the screen SHALL NOT suggest that it did. The dialog SHALL say that invoices already issued keep the count they were issued with.

A count below one SHALL be refused, as the API refuses it, and the refusal SHALL name the field.

#### Scenario: Correcting the count on a running tenancy

- **WHEN** the owner opens the edit beside "Tính tiền cho" on a running tenancy, enters a new number and saves
- **THEN** the card shows the new number, and the recorded occupants are unchanged

#### Scenario: A tenancy that has ended

- **WHEN** the owner views a tenancy that has ended or was cancelled
- **THEN** no edit control is offered beside the count

#### Scenario: Issued invoices are not rewritten

- **WHEN** the owner changes the count on a tenancy that already has invoices
- **THEN** those invoices still show the count they were issued with

#### Scenario: A count below one

- **WHEN** the owner enters 0 and saves
- **THEN** the form refuses, names the field, and nothing is saved
