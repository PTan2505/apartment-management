## MODIFIED Requirements

### Requirement: A tenant can start paying a bill

The system SHALL allow a tenant presenting a valid portal token to start a payment for one of their unpaid bills, and SHALL return what is needed to pay it: the bank and account the gateway allocated for this attempt, the name that account is held under, the amount, the description that will accompany the transfer, and a link to the gateway's own checkout page.

**The account returned SHALL be the one the gateway allocated**, never the owner's own. The gateway allocates a fresh account per attempt and matches an incoming transfer to the attempt by it; a transfer to the owner's real account reaches the owner and is never reported, so the bill would stay unpaid forever with the money already spent.

These details are returned so that whatever displays them can render a payment code from them. The gateway returns them already; the system previously discarded all but two.

The bills a tenant may pay SHALL be exactly the bills that token can already see. A token that cannot show an invoice SHALL NOT be able to pay one, and SHALL answer a request to pay it identically to a request to see it: as though it does not exist.

One bill at a time. Nothing is combined, so nothing has to be divided when a payment arrives for less than was asked.

**A bill SHALL have at most one live payment at a time.** Returning to a bill that already has one SHALL hand back the same details, not create another. Two codes for one debt gives the tenant a choice they cannot make correctly and the owner a list of attempts of which all but one will sit there unpaid forever.

Before an existing attempt is handed back, the system SHALL confirm with the gateway that it is still payable, and SHALL record what became of it where it is not. A code the gateway has cancelled or let expire is worse to return than a new one.

An already-paid bill SHALL NOT be payable again. A tenant who has paid is not asked twice.

Starting a payment SHALL NOT settle anything. Money has not moved, and the bill stays unpaid until the gateway says otherwise.

Where online payment is not configured, the system SHALL say so rather than fail. The portal remains useful for reading a bill without it.

#### Scenario: Starting a payment

- **WHEN** a tenant starts a payment for an unpaid bill they can see
- **THEN** the response carries the bank, the account allocated for it, the account name, the amount, the description, and a link to the gateway's checkout page

#### Scenario: The account is the gateway's, not the owner's

- **WHEN** a tenant starts a payment
- **THEN** the account returned is the one the gateway allocated for that attempt, and is not the owner's own bank account

#### Scenario: The amount returned is the amount owed

- **WHEN** a tenant starts a payment for a bill
- **THEN** the amount returned equals that bill's total

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
- **THEN** the same details are handed back, and no second attempt is created

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
