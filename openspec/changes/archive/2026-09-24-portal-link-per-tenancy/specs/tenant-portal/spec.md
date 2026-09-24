## REMOVED Requirements

### Requirement: Owner can issue a portal link for a tenant

**Reason**: A link now belongs to a tenancy, not to a person. Issuing one per
customer meant a second tenancy could not have its own link, and issuing a new
one revoked the link that person was already using for another tenancy.

**Migration**: `POST|GET|DELETE /customers/:id/portal-link` are withdrawn and
replaced by the same three operations under `/leases/:id/portal-link`. Nothing
on any screen called the removed endpoints.

### Requirement: A tenant sees their own tenancies and nothing else

**Reason**: The rule existed to keep one person's token from showing another
tenancy's bills, which is now a property of the token itself: it names one
tenancy and can reach nothing else. The occupancy-derived version also had to
carve out an exception for the final bill of a tenancy somebody had just left;
a tenancy-scoped link needs no exception, because leaving does not change which
tenancy the link is for.

**Migration**: Replaced by "A link shows the bills of the tenancy it was issued
for". A tenant who occupied two tenancies now holds two links rather than one.

## ADDED Requirements

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

## MODIFIED Requirements

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
