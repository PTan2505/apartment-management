## ADDED Requirements

### Requirement: A tenant can start paying a bill

The system SHALL allow a tenant presenting a valid portal token to start a payment for one of their unpaid bills, and SHALL return something they can pay with — a code to scan and a link to open.

The bills a tenant may pay SHALL be exactly the bills that token can already see. A token that cannot show an invoice SHALL NOT be able to pay one, and SHALL answer a request to pay it identically to a request to see it: as though it does not exist.

One bill at a time. Nothing is combined, so nothing has to be divided when a payment arrives for less than was asked.

**A bill SHALL have at most one live payment at a time.** Returning to a bill that already has one SHALL hand back the same code and the same link, not create another. Two codes for one debt gives the tenant a choice they cannot make correctly and the owner a list of attempts of which all but one will sit there unpaid forever.

Before an existing attempt is handed back, the system SHALL confirm with the gateway that it is still payable, and SHALL record what became of it where it is not. A code the gateway has cancelled or let expire is worse to return than a new one.

An already-paid bill SHALL NOT be payable again. A tenant who has paid is not asked twice.

Starting a payment SHALL NOT settle anything. Money has not moved, and the bill stays unpaid until the gateway says otherwise.

Where online payment is not configured, the system SHALL say so rather than fail. The portal remains useful for reading a bill without it.

#### Scenario: Starting a payment

- **WHEN** a tenant starts a payment for an unpaid bill they can see
- **THEN** the response carries a code to scan and a link to open

#### Scenario: The bill stays unpaid until the money arrives

- **WHEN** a tenant starts a payment
- **THEN** the bill still reports itself as unpaid and nothing has been received

#### Scenario: Paying a bill the token cannot see

- **WHEN** a tenant starts a payment for an invoice belonging to a tenancy they have never occupied
- **THEN** the system responds exactly as it would for an invoice that does not exist

#### Scenario: Paying a bill of a room they have left

- **WHEN** a tenant starts a payment for an invoice issued for their former room after they left it
- **THEN** the system responds exactly as it would for an invoice that does not exist

#### Scenario: Paying an already-paid bill

- **WHEN** a tenant starts a payment for a bill that has already been paid
- **THEN** the system refuses and no payment attempt is created

#### Scenario: Returning to a bill already being paid

- **WHEN** a tenant starts a payment for a bill they already have a live attempt for
- **THEN** the same code and the same link are handed back, and no second attempt is created

#### Scenario: An attempt the gateway has cancelled

- **WHEN** a tenant returns to a bill whose attempt the gateway reports as cancelled
- **THEN** that attempt is recorded as cancelled and a fresh one is created

#### Scenario: An attempt the gateway has let expire

- **WHEN** a tenant returns to a bill whose attempt the gateway reports as expired
- **THEN** that attempt is recorded as expired and a fresh one is created

#### Scenario: A bill the gateway says was already paid

- **WHEN** a tenant returns to a bill the gateway reports as paid, for which no confirmation ever arrived
- **THEN** the payment is settled, the bill reports itself as paid, and the tenant is told it is already paid rather than being asked to pay again

#### Scenario: Online payment is not configured

- **WHEN** a tenant starts a payment and no gateway is configured
- **THEN** the response says online payment is unavailable, and the bill is unaffected

#### Scenario: Starting a payment requires a portal token

- **WHEN** a payment is started without a valid portal token
- **THEN** the system responds as it does for any other portal request without one

## MODIFIED Requirements

### Requirement: The portal reports a bill in full, in its own shape

An invoice shown in the portal SHALL carry the charges that make it up — each with its description, the quantity and rate it was computed from where it had them, the period it covers, and its amount — together with the invoice's total, what kind of bill it is, when it was issued, and whether it has been paid.

Itemisation is the point of the feature. A total alone is what an owner can already read down the phone; what a tenant cannot otherwise check is the meter reading, the rate applied and the days prorated.

An unpaid bill SHALL also report whether a payment attempt is already in progress for it, so a tenant who has scanned a code and not finished is not made to start again without knowing.

The portal's response SHALL be assembled for the tenant rather than reusing the shape returned to the owner. A field added for the owner's benefit would otherwise appear in a tenant's response the day it is added, with nobody deciding that it should. **This holds for the gateway's own fields too**: what the gateway called a payment, what it replied, and what it sent are the owner's business and the system's, not the tenant's.

#### Scenario: A bill shows its charges

- **WHEN** a tenant views a monthly invoice
- **THEN** it lists its rent, electricity, water and service fee charges, each with its own amount and the period it covers

#### Scenario: Electricity shows what it was computed from

- **WHEN** a tenant views an invoice charging metered electricity
- **THEN** the charge reports the consumption and the rate applied to it

#### Scenario: A bill reports whether it is paid

- **WHEN** a tenant views their bills
- **THEN** each reports whether it has been paid

#### Scenario: A bill reports an attempt in progress

- **WHEN** a tenant views an unpaid bill they have already started paying
- **THEN** it reports that an attempt is in progress

#### Scenario: The gateway's own fields stay out

- **WHEN** a tenant views their bills
- **THEN** the response carries no gateway reference, no stored payload and no credential

#### Scenario: The tenant's response is its own shape

- **WHEN** a field is added to the invoice shape returned to an owner
- **THEN** it does not appear in the portal's response unless it is added there deliberately
