## MODIFIED Requirements

### Requirement: The owner can find the bills they are looking for

The application SHALL let the owner narrow invoices by building, by room, by month, by whether they are settled, **and by what kind of bill they are**.

Unpaid is the filter this exists for. An owner chasing money asks "who has not paid", and that question has no answer in a list ordered by anything else.

Kind is the filter that makes a row readable. A move-in bill, a month, a closing bill, an overdue bill and a one-off charge are different things that look identical as an amount, and an owner looking for "the one-off charges I raised" has no way to ask for them.

The application SHALL let the owner choose the ORDER of the list: what is owed first, newest first, or oldest first. The order SHALL be requested from the API rather than applied to the page in the browser: the list is paginated, and reordering the rows that happen to be on screen produces a list that looks sorted and is not.

Voided invoices SHALL be excluded unless asked for. They are a record of what was withdrawn, not a bill anybody owes, and mixing them into a list of outstanding money makes that list wrong. Where they are asked for, they SHALL sort after the live ones.

#### Scenario: Chasing what is owed

- **WHEN** the owner filters invoices to those not settled
- **THEN** only unpaid, non-voided invoices are listed

#### Scenario: Narrowing to a building and month

- **WHEN** the owner filters by building and month
- **THEN** only invoices for tenancies in that building, for that month, are listed

#### Scenario: Narrowing to one kind

- **WHEN** the owner filters to one kind of bill
- **THEN** only bills of that kind are listed, and the filter says which kind is showing

#### Scenario: Choosing the order

- **WHEN** the owner chooses to see the oldest first
- **THEN** the list is re-fetched in that order rather than reordered in the browser

#### Scenario: Voided bills stay out of the way

- **WHEN** the owner lists invoices without asking for voided ones
- **THEN** none are listed

## ADDED Requirements

### Requirement: A bill says what kind it is and when it was issued

The list SHALL show, for every bill, what kind it is and the date it was issued.

The amount does not identify the bill. A move-in bill charging a deposit and the first month, a month of rent and utilities, a closing bill, a charge for days beyond the term and a one-off penalty are five different events, and on this screen they are five identical numbers. An owner reading a row has to open it to find out what it is.

The issue date is the other half of the same problem: a bill raised in March and one raised last week are indistinguishable in a list ordered by anything, and the month a bill COVERS is not the day it was raised — a closing bill and a one-off charge cover no month at all.

The kind SHALL be named in the reader's language, using the same words the rest of the application uses for it.

#### Scenario: Reading the list

- **WHEN** the owner opens the invoice list
- **THEN** each row shows what kind of bill it is and the date it was issued

#### Scenario: A bill covering no month

- **WHEN** a bill covers no month, such as a one-off charge
- **THEN** its issue date is still shown, and its period reads as covering none

#### Scenario: The words match the rest of the application

- **WHEN** a kind is shown in the list and on the bill itself
- **THEN** the same Vietnamese name is used in both places
