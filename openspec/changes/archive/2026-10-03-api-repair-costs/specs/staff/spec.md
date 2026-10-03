## MODIFIED Requirements

### Requirement: A manager runs a building but does not read its earnings

A `manager` SHALL be able to do what running a building requires: register customers,
sign tenancies, renew and close them, record occupants, issue invoices, run a month's
billing, settle deposits, and issue a tenancy's payment link — all within their assigned
buildings.

A `manager` SHALL NOT reach the revenue report, the deposits-held listing, the staff
endpoints, or any endpoint that creates or changes a BUILDING, including its electricity
and water rates, its default deposit months, and its service fees.

A `manager` SHALL NOT create, correct, retire or restore a ROOM. Listing and retrieving
rooms remain open to them. A room is created with the rent it asks, so creating one sets
a price; correcting one changes a price already set.

A `manager` SHALL NOT supply the money terms of a tenancy they sign or renew — its base
rent, electricity rate, water rate per person, or deposit months. Each is taken from the
room and its building. A request that supplies any of them SHALL be refused, and nothing
created: a rent that was typed and silently discarded would leave the manager believing
the tenancy carries a figure it does not.

A `manager` SHALL NOT correct the terms of a tenancy once it exists, including its
occupant count.

A `manager` SHALL NOT declare money settled or unsettled: recording a payment against an
invoice, withdrawing an invoice, and reversing a recorded payment are the owner's.
Money that arrives through a tenancy's payment link is unaffected, because no person
declares it — the payment gateway reports it.

A `manager` SHALL NOT write EXPENSES either: creating, correcting and deleting one, and
recording a vacant room's electricity, are the owner's. What the business spends is the
same kind of statement as what it has received, and a repair cost reduces the reported
earnings a manager may not read.

These bound what a manager may WRITE. Everything in the list above remains readable to
them within their buildings: a manager who cannot set a rent still has to be able to see
it, and a manager who cannot record a payment still has to know which invoices are owed.

#### Scenario: A manager signs a tenancy

- **WHEN** a manager signs a tenancy for a room in a building they cover, naming no money terms
- **THEN** it is created, carrying the room's base rent, the building's rates, and the building's default deposit months

#### Scenario: A manager signs outside their buildings

- **WHEN** a manager signs a tenancy for a room in a building they do not cover
- **THEN** the system responds with HTTP 404 for that room and nothing is created

#### Scenario: A manager names a rent of their own

- **WHEN** a manager signs a tenancy supplying a base rent, an electricity rate, a water rate or a number of deposit months
- **THEN** the system responds with HTTP 403, names the terms that are not theirs to set, and creates nothing

#### Scenario: A manager renews at a rent of their own

- **WHEN** a manager renews a tenancy supplying a base rent or a number of deposit months
- **THEN** the system responds with HTTP 403 and neither tenancy changes

#### Scenario: A manager renews on the owner's terms

- **WHEN** a manager renews a tenancy naming only its length, its closing meter reading and its occupant count
- **THEN** the renewal is created, carrying the room's current base rent and the deposit months the predecessor was signed at

#### Scenario: The revenue report

- **WHEN** a manager calls the revenue report
- **THEN** the system responds with HTTP 403

#### Scenario: A building's rates

- **WHEN** a manager updates a building or one of its service fees
- **THEN** the system responds with HTTP 403 and nothing changes

#### Scenario: A room's rent

- **WHEN** a manager creates, updates, retires or restores a room
- **THEN** the system responds with HTTP 403 and nothing changes

#### Scenario: A manager reads the rooms they cover

- **WHEN** a manager lists or retrieves a room in a building they cover
- **THEN** the room is returned, base rent included

#### Scenario: Correcting a signed tenancy

- **WHEN** a manager corrects any term of an existing tenancy, its occupant count included
- **THEN** the system responds with HTTP 403 and the tenancy is unchanged

#### Scenario: Settling an invoice

- **WHEN** a manager records a payment against an invoice, withdraws an invoice, or reverses a recorded payment
- **THEN** the system responds with HTTP 403 and nothing is recorded

#### Scenario: A tenant pays through their link

- **WHEN** a tenant of a manager's building pays through their payment link
- **THEN** the payment is recorded as it would be for any building, unaffected by who manages it

#### Scenario: A manager sees what is owed

- **WHEN** a manager lists the invoices of a building they cover
- **THEN** each invoice is returned with what it charges and what it still owes

#### Scenario: A manager records an expense

- **WHEN** a manager creates, corrects or deletes an expense, or records a vacant room's electricity
- **THEN** the system responds with HTTP 403 and nothing is written

#### Scenario: A manager reads the expenses of their buildings

- **WHEN** a manager lists or retrieves the expenses of a building they cover
- **THEN** they are returned, with their amounts
