## Purpose

Lets a tenant see their own bills through a link the owner sends them once, with no account and no password, while giving the owner the means to issue, replace and withdraw those links.

## ADDED Requirements

### Requirement: Owner can issue a portal link for a tenant

The system SHALL allow an authenticated `owner` to generate a portal access token for a `customer`, and SHALL return the token itself **once**, in that response and never again.

The token SHALL be stored hashed. Storing it in the clear would mean a copy of the database is a copy of every tenant's link.

A customer SHALL have at most one usable token at a time. Generating a new one SHALL revoke the previous one, so an owner who suspects a link has been shared can replace it in one action rather than two.

The owner SHALL also be able to revoke a token outright, leaving the customer with no working link.

Issuing a token for a user who is not a `customer` SHALL be refused. An owner signs in with a password; a portal link is for someone who cannot.

#### Scenario: Generating a link

- **WHEN** an authenticated owner generates a portal link for a customer
- **THEN** the response carries the token, and the customer has a usable link

#### Scenario: The token is shown once

- **WHEN** an authenticated owner retrieves a customer after generating their link
- **THEN** the response reports that a link exists and when it was issued, and does not carry the token

#### Scenario: Regenerating replaces the previous link

- **WHEN** an authenticated owner generates a second portal link for a customer
- **THEN** the new token works and the previous one no longer does

#### Scenario: Revoking a link

- **WHEN** an authenticated owner revokes a customer's portal link
- **THEN** that token no longer works and the customer has no usable link

#### Scenario: Revoking when there is no link

- **WHEN** an authenticated owner revokes a portal link for a customer who has none
- **THEN** the system responds with HTTP 404 and nothing changes

#### Scenario: A link for an owner account

- **WHEN** an authenticated owner generates a portal link for a user whose role is `owner`
- **THEN** the system responds with HTTP 400 and no token is created

#### Scenario: Issuing requires an authenticated owner

- **WHEN** a portal link is generated or revoked without an access token whose role is `owner`
- **THEN** the system responds with HTTP 401 or 403 and nothing is created or changed

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

The system SHALL allow anyone presenting a valid portal token to retrieve the tenant's own details and bills, with no access token, no password and no session.

The token SHALL be accepted in a request header rather than in the URL path or query string. A token in the URL is written into the server's request log on every call, and a log is ordinarily less protected than the database the token is deliberately hashed inside.

An unknown token, a revoked token and a malformed one SHALL all produce the same response. Answering them differently tells someone probing which of their guesses was once real.

The system SHALL record when a token was last used, so an owner can see whether a link they issued is being used at all.

#### Scenario: Opening the portal

- **WHEN** a valid portal token is presented
- **THEN** the response carries the tenant's name and their bills

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

### Requirement: A tenant sees their own tenancies and nothing else

A portal token SHALL grant sight of:

- every invoice of a tenancy the holder currently occupies, and
- every **unpaid** invoice of a tenancy the holder has left.

It SHALL NOT grant sight of invoices issued for a tenancy after the holder left it. Somebody who has moved out has no claim on the bills of the people who moved in.

The unpaid invoices of a former tenancy are included because they are still owed. This also covers the final bill, which is issued at the moment a move-out is recorded and would otherwise become invisible to the person it is addressed to.

Voided invoices SHALL NOT be shown. They were withdrawn.

#### Scenario: Seeing the bills of a current tenancy

- **WHEN** a tenant with a running tenancy opens the portal
- **THEN** they see every invoice of that tenancy, paid and unpaid

#### Scenario: Seeing an unpaid bill after moving out

- **WHEN** a tenant who has moved out still owes for their final month
- **THEN** they see that invoice

#### Scenario: Not seeing the bills of a room they left

- **WHEN** an invoice is issued for a tenancy after the holder left it
- **THEN** they do not see it

#### Scenario: Not seeing another tenant's bills

- **WHEN** a tenant opens the portal
- **THEN** they see no invoice belonging to a tenancy they have never occupied

#### Scenario: A tenant sharing a room sees its bills

- **WHEN** an occupant who is not the lease signatory opens the portal
- **THEN** they see the invoices of the tenancy they occupy, because the bill covers the room they live in

#### Scenario: Voided invoices are hidden

- **WHEN** an invoice a tenant could otherwise see has been voided
- **THEN** it is absent from their portal

#### Scenario: A tenant with no tenancy

- **WHEN** a customer who has never occupied a tenancy opens the portal
- **THEN** the response carries their details and no invoices, rather than an error

### Requirement: The portal reports a bill in full, in its own shape

An invoice shown in the portal SHALL carry the charges that make it up — each with its description, the quantity and rate it was computed from where it had them, the period it covers, and its amount — together with the invoice's total, what kind of bill it is, when it was issued, and whether it has been paid.

Itemisation is the point of the feature. A total alone is what an owner can already read down the phone; what a tenant cannot otherwise check is the meter reading, the rate applied and the days prorated.

The portal's response SHALL be assembled for the tenant rather than reusing the shape returned to the owner. A field added for the owner's benefit would otherwise appear in a tenant's response the day it is added, with nobody deciding that it should.

#### Scenario: A bill shows its charges

- **WHEN** a tenant views a monthly invoice
- **THEN** it lists its rent, electricity, water and service fee charges, each with its own amount and the period it covers

#### Scenario: Electricity shows what it was computed from

- **WHEN** a tenant views an invoice charging metered electricity
- **THEN** the charge reports the consumption and the rate applied to it

#### Scenario: A bill reports whether it is paid

- **WHEN** a tenant views their bills
- **THEN** each reports whether it has been paid

#### Scenario: The tenant's response is its own shape

- **WHEN** a field is added to the invoice shape returned to an owner
- **THEN** it does not appear in the portal's response unless it is added there deliberately
