## ADDED Requirements

### Requirement: The owner can create staff accounts

The system SHALL allow an authenticated `owner` to create an account whose role
is `manager` or `maintenance`, identified by a phone number, and SHALL refuse a
phone number already in use.

The system SHALL generate the first password rather than accept one, and SHALL
return it exactly ONCE, in the response that creates the account. It is stored
hashed like any other, so there is no way to show it again — which is the point:
a password an owner can look up is a password the system keeps in readable form.

Only an `owner` SHALL create, change or deactivate a staff account. A manager
running a building is not thereby running the payroll.

#### Scenario: Creating a manager

- **WHEN** an owner creates a manager with a phone number and a name
- **THEN** the account exists, and the response carries a generated password once

#### Scenario: The password is never shown again

- **WHEN** the owner retrieves that staff member afterwards
- **THEN** the response carries no password, in any form

#### Scenario: A phone number already in use

- **WHEN** an owner creates staff with a phone number that already belongs to somebody
- **THEN** the system responds with HTTP 409 and no account is created

#### Scenario: Staff cannot create staff

- **WHEN** a manager or maintenance account calls the staff endpoints
- **THEN** the system responds with HTTP 403

#### Scenario: A forgotten password

- **WHEN** an owner resets a staff member's password
- **THEN** a new one is generated and shown once, the old one stops working, and the account must change it again at next sign-in

#### Scenario: Deactivating

- **WHEN** an owner deactivates a staff account
- **THEN** that account can no longer sign in, and its existing sessions are revoked

### Requirement: The owner reaches everything, and this change takes nothing away

An `owner` SHALL reach every endpoint in the system, over every building, and
SHALL NOT be narrowed by any scope this change introduces. Adding roles is
adding people below the owner, never carving the owner down.

This is stated as a requirement rather than left as the absence of a rule,
because the scoping is applied in one middleware that every listing consults: a
change that forgets to exempt the owner would narrow them silently, and an owner
with two buildings would simply see fewer tenancies than they have.

Every capability added later — damage reports among them — SHALL be reachable by
the owner without being assigned to anything. Assignment is how STAFF are given
a subset; the owner has no subset.

#### Scenario: Nothing is narrowed for the owner

- **WHEN** an owner lists rooms, tenancies, invoices, expenses or damage reports
- **THEN** every building's records are returned, whatever assignments exist

#### Scenario: The owner is assigned to nothing

- **WHEN** an owner has no building assignment at all
- **THEN** they still see everything, because assignment does not apply to them

#### Scenario: Every action stays available

- **WHEN** an owner calls any endpoint a manager may call
- **THEN** it is answered for them too, over any building

### Requirement: Staff are assigned to buildings, and see only those

The system SHALL record which buildings a staff account covers, as a
many-to-many assignment: one person may cover several buildings, and one
building may have several managers and several maintenance workers.

Every listing that belongs to a building SHALL be narrowed to the caller's
assigned buildings when that caller is staff — rooms, tenancies, invoices,
payments, expenses, service fees, deposits and damage reports. Retrieving a
single record outside them SHALL answer as though it does not exist, so that an
id cannot be probed to learn what exists elsewhere.

An `owner` SHALL NOT be narrowed. They see everything, as now.

Staff with no assignment SHALL see an empty list rather than an error: a newly
created account before the owner has assigned it is a real state.

#### Scenario: A manager lists rooms

- **WHEN** a manager assigned to one building lists rooms
- **THEN** only that building's rooms are returned

#### Scenario: Reaching a record in another building

- **WHEN** a manager retrieves a tenancy in a building they are not assigned to
- **THEN** the system responds with HTTP 404, the same answer a tenancy that does not exist would produce

#### Scenario: Several buildings

- **WHEN** a manager assigned to two buildings lists tenancies
- **THEN** tenancies from both are returned, and none from a third

#### Scenario: Assigned to nothing yet

- **WHEN** a staff account with no building assignment lists rooms
- **THEN** the response is an empty list

#### Scenario: The owner is not narrowed

- **WHEN** the owner lists rooms
- **THEN** every building's rooms are returned

### Requirement: A manager runs a building but does not read its earnings

A `manager` SHALL be able to do what running a building requires: create and
update rooms, register customers, sign tenancies, renew and close them, record
occupants, issue and withdraw invoices, run a month's billing, record payments
and expenses, settle deposits, and issue a tenancy's payment link — all within
their assigned buildings.

A `manager` SHALL NOT reach the revenue report, the deposits-held listing, the
staff endpoints, or any endpoint that creates or changes a BUILDING, including
its electricity and water rates and its service fees. Those decide what the
business charges and what it earns; running a building is carrying them out.

#### Scenario: A manager signs a tenancy

- **WHEN** a manager signs a tenancy for a room in a building they cover
- **THEN** it is created, exactly as it would be for the owner

#### Scenario: A manager signs outside their buildings

- **WHEN** a manager signs a tenancy for a room in a building they do not cover
- **THEN** the system responds with HTTP 404 for that room and nothing is created

#### Scenario: The revenue report

- **WHEN** a manager calls the revenue report
- **THEN** the system responds with HTTP 403

#### Scenario: A building's rates

- **WHEN** a manager updates a building or one of its service fees
- **THEN** the system responds with HTTP 403 and nothing changes

### Requirement: Maintenance sees what needs fixing and nothing else

A `maintenance` account SHALL reach the damage reports of its assigned
buildings, and SHALL be refused every other domain endpoint — rooms, tenancies,
customers, invoices, payments, expenses, buildings, reports of revenue.

A damage report carries what is needed to act on it: the room, the building, and
how to reach the person who raised it. That is a property of the report rather
than a second permission, so it needs no access to the tenancy behind it.

#### Scenario: Maintenance lists its reports

- **WHEN** a maintenance account lists damage reports
- **THEN** it sees the reports of the buildings it is assigned to

#### Scenario: Maintenance reaches for a tenancy

- **WHEN** a maintenance account calls any tenancy, invoice or customer endpoint
- **THEN** the system responds with HTTP 403
