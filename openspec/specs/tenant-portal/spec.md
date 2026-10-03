## Purpose

Lets a tenant see and pay the bills of the tenancy they were sent a link for, with no account and no password, while giving the owner the means to read that link back, replace it, and withdraw it.
## Requirements
### Requirement: A portal token is unguessable

A portal token SHALL be generated from a cryptographically secure random source and SHALL carry at least 256 bits of entropy.

This is a requirement rather than an implementation detail because nothing else defends the portal. There is no rate limit, no lockout and no second factor; the endpoints are public and answer anyone who presents a valid token. A token derived from an identifier, a timestamp, or a general-purpose UUID would make the whole surface guessable, and nothing downstream would notice.

A token SHALL NOT encode the identity it grants access to. What it unlocks is a matter for the record it is stored against, not for anyone holding it to read.

#### Scenario: Two tokens are unrelated

- **WHEN** portal links are generated for two customers in succession
- **THEN** neither token can be derived from the other, from the customers' ids, or from the time of issue

#### Scenario: A token reveals nothing about its holder

- **WHEN** a portal token is inspected
- **THEN** it carries no readable customer id, phone number or name

### Requirement: A tenant can open the portal without an account

The system SHALL allow anyone presenting a valid portal token to retrieve the tenancy's details and bills, with no access token, no password and no session.

The token SHALL be accepted in a request header rather than in the URL path or query string. A token in the URL is written into the server's request log on every call, and a log is ordinarily less protected than the database the token is deliberately encrypted inside.

An unknown token, a revoked token and a malformed one SHALL all produce the same response. Answering them differently tells someone probing which of their guesses was once real.

The system SHALL record when a token was last used, so an owner can see whether a link they issued is being used at all.

#### Scenario: Opening the portal

- **WHEN** a valid portal token is presented
- **THEN** the response carries the room the tenancy is for, the name of whoever signed it if there is one, and that tenancy's bills

#### Scenario: An unknown token

- **WHEN** a token that was never issued is presented
- **THEN** the system responds with HTTP 404

#### Scenario: A revoked token

- **WHEN** a token that has been revoked is presented
- **THEN** the system responds with HTTP 404, indistinguishable from a token that never existed

#### Scenario: A malformed token

- **WHEN** a value that is not a token at all is presented
- **THEN** the system responds with HTTP 404, indistinguishable from the other two

#### Scenario: No token

- **WHEN** a portal endpoint is called with no token at all
- **THEN** the system responds with HTTP 401

#### Scenario: Use is recorded

- **WHEN** a tenant opens the portal
- **THEN** the token records that it was used, and the owner can see when

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

### Requirement: The portal says where a bill is from

The portal SHALL report, for each bill, the building the room belongs to.

A person may hold tenancies in two buildings, and a room code alone does not say which — P202 is a plausible room code in any of them. A tenant reading a bill needs to know which place it is about before any of its figures mean anything.

The building SHALL be reported by the name a tenant would recognise, not by an identifier. The portal's shape deliberately withholds how the system is organised — lease ids, room ids, the deposit, anything about the owner's finances — and a building's name is not that: it is where the person lives.

#### Scenario: A bill says where it is from

- **WHEN** a tenant reads a bill in the portal
- **THEN** the building its room belongs to is reported with it, by name

#### Scenario: Two buildings

- **WHEN** a tenant holds tenancies in two buildings and has bills for both
- **THEN** each bill reports its own building

#### Scenario: Still not how the system is organised

- **WHEN** a tenant reads any bill
- **THEN** no lease id, room id or building id is reported with it

### Requirement: A settled bill says when it was settled

The portal SHALL report, for a bill that has been paid, the date it was settled.

A tenant who paid last week and returns to check needs to see that the payment landed and when. "Paid" alone tells them the system agrees with them; it does not tell them the system agrees about the payment they are thinking of, which is the question somebody asks after a transfer they are unsure of.

The date SHALL be the date of the payment that settled the bill, read from the payments recorded against it rather than stored again beside the bill. A second copy is a second thing to disagree with the payments beneath it.

Where a bill is settled but no payment carries a date, the portal SHALL report the settlement date as absent rather than substituting the issue date or today.

#### Scenario: A settled bill

- **WHEN** a tenant reads a bill that has been paid
- **THEN** the date it was settled is reported with it

#### Scenario: An unpaid bill

- **WHEN** a tenant reads a bill that has not been paid
- **THEN** no settlement date is reported

#### Scenario: Settled with no date recorded

- **WHEN** a bill is settled but the payment that settled it carries no date
- **THEN** the settlement date is reported as absent rather than guessed

### Requirement: Every tenancy carries its own payment link

The system SHALL issue a portal token for a tenancy when the tenancy is created,
and SHALL allow an authenticated `owner` to reissue or withdraw it.

A tenancy SHALL have at most one usable token at a time. Reissuing SHALL revoke
the previous token in the same operation, so an owner who believes a link has
gone astray replaces it in one action and there is never a moment when both
work.

A renewal is a different tenancy and SHALL therefore receive its own link. The
previous tenancy keeps its own, which still reaches its own unpaid bills.

Whoever holds a tenancy's link SHALL be able to see and pay that tenancy's
bills. It is a payment link rather than a sign-in: there is no identity behind
it to check, and the owner's alternative — a link per occupant — was declined.

#### Scenario: A tenancy is signed

- **WHEN** an owner creates a tenancy
- **THEN** it has a usable payment link straight away, with no further action

#### Scenario: Reissuing replaces the previous link

- **WHEN** an owner reissues a tenancy's link
- **THEN** the new token works and the previous one no longer does

#### Scenario: Withdrawing a link

- **WHEN** an owner withdraws a tenancy's link
- **THEN** that token no longer works and the tenancy has no usable link

#### Scenario: Withdrawing a link that is not there

- **WHEN** an owner withdraws the link of a tenancy that has none
- **THEN** the system responds with HTTP 404 and nothing changes

#### Scenario: A renewal gets its own link

- **WHEN** a tenancy is renewed
- **THEN** the new tenancy has its own link and the previous link still reaches the previous tenancy

#### Scenario: Issuing requires an authenticated owner

- **WHEN** a tenancy's link is reissued or withdrawn without an access token whose role is `owner`
- **THEN** the system responds with HTTP 401 or 403 and nothing changes

### Requirement: An issued link can be shown again

The system SHALL allow an authenticated `owner` to read back the token of a
tenancy's current link, so a link can be sent again without replacing it.

The token SHALL NOT be stored in the clear. It SHALL be kept encrypted under a
key derived from the application's own secret, so that a copy of the database
alone is not a copy of every tenancy's link — the property the earlier
hashed-only storage existed to protect, kept while making the token readable to
the one party entitled to read it.

Lookup of a presented token SHALL NOT decrypt anything: a stored hash SHALL
remain the means of finding the row, so a public request costs one indexed
equality and never a key operation.

Where a stored token cannot be decrypted — the application secret has been
rotated since it was issued — the system SHALL report that the link exists but
cannot be shown, rather than failing the request or inventing a token. The link
itself still works, and reissuing produces one that can be shown.

#### Scenario: Showing an existing link

- **WHEN** an owner asks for a tenancy's payment link
- **THEN** the response carries the token itself, and asking again returns the same one

#### Scenario: Finding a presented token

- **WHEN** a tenant presents a token
- **THEN** it is found by its stored hash, with nothing decrypted

#### Scenario: A token that can no longer be read

- **WHEN** the application secret has changed since a token was issued
- **THEN** the owner is told the link exists but cannot be shown, and reissuing gives a readable one

### Requirement: A link shows the bills of the tenancy it was issued for

A portal token SHALL grant sight of every invoice of the tenancy it was issued
for, paid and unpaid, and of no invoice of any other tenancy.

Voided invoices SHALL NOT be shown. They were withdrawn.

The bills payable SHALL be exactly the bills visible, decided by one rule used
by both the reading and the paying — a token that cannot show a bill must not be
able to pay one.

#### Scenario: The bills of that tenancy

- **WHEN** a link is opened
- **THEN** it shows every invoice of its tenancy, paid and unpaid

#### Scenario: Nothing from another tenancy

- **WHEN** a link is opened
- **THEN** no invoice of any other tenancy appears, including one for the same room under a later tenancy

#### Scenario: A final bill stays reachable

- **WHEN** a move-out is recorded and the final bill is issued
- **THEN** the tenancy's link still shows it, because the link belongs to the tenancy rather than to who currently lives there

#### Scenario: Voided invoices are hidden

- **WHEN** an invoice of the tenancy has been voided
- **THEN** it is absent from the portal

#### Scenario: A tenancy with no bills yet

- **WHEN** a link is opened for a tenancy that has not been billed
- **THEN** the response carries the tenancy's details and no invoices, rather than an error

#### Scenario: Paying a bill the token cannot see

- **WHEN** a payment is started for an invoice belonging to another tenancy
- **THEN** the system responds with HTTP 404, the same answer an invoice that does not exist would produce

### Requirement: The portal shows the reports raised from it

The portal SHALL return the damage reports of the tenancy the token was issued
for, each carrying what was reported, its state, and the appointment agreed with
the tenant where there is one.

It SHALL NOT carry who among the staff recorded or closed it. A tenant needs to
know somebody is coming and when, not the staffing of the building.

#### Scenario: A tenant checks a report

- **WHEN** a tenant opens their portal link after reporting something
- **THEN** they see the report, its state, and the appointment if one has been agreed

#### Scenario: Only their own tenancy's

- **WHEN** a tenant opens the portal
- **THEN** no report of any other tenancy appears

#### Scenario: Nothing reported

- **WHEN** a tenancy has raised no reports
- **THEN** the portal says so rather than showing an empty area

### Requirement: The portal registers a visitor

The portal token SHALL authorise registering a visitor against its own tenancy, listing
that tenancy's registrations, and cancelling one.

Nothing SHALL ask the tenant which room or which tenancy. The token already says, exactly
as it does for a bill and for a fault report.

A portal token SHALL NOT reach any other tenancy's registrations, and SHALL NOT reach
staff-only facilities — it remains the public, link-only surface it is, and registering a
visitor grants nothing beyond it.

A cancelled or finished registration SHALL remain visible to the tenant, so they can see
what they have filed.

#### Scenario: A tenant registers somebody

- **WHEN** a tenant opens their link and registers a visitor with dates and an ID number
- **THEN** it is recorded against their tenancy, and nothing asked them which room they live in

#### Scenario: Reading their own

- **WHEN** a tenant lists registrations through their link
- **THEN** they see only their own tenancy's

#### Scenario: Another tenancy's

- **WHEN** a portal token is used against a registration belonging to a different tenancy
- **THEN** the system responds with HTTP 404

#### Scenario: A revoked link

- **WHEN** the tenancy's link has been revoked
- **THEN** registering is refused, exactly as paying and reporting already are

