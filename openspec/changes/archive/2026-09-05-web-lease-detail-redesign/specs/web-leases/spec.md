## MODIFIED Requirements

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

## ADDED Requirements

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
