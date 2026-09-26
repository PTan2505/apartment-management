## ADDED Requirements

### Requirement: A staff account must replace its first password before doing anything

An account created with a generated password SHALL be marked as owing a password
change, and SHALL be refused every endpoint except signing in, reading its own
account, changing its password, and signing out — until it has changed it.

The refusal SHALL carry a distinct error code, so a client can send the person to
a change-password screen rather than reporting a permission problem they cannot
act on.

The mark SHALL be cleared by the change itself, and SHALL be set again whenever
an owner resets the password. A password the owner has seen is a password the
staff member has not chosen.

Signing in SHALL report that the change is owed, so a client can go straight
there rather than discovering it on the first refused request.

#### Scenario: First sign-in

- **WHEN** a staff account signs in with its generated password
- **THEN** the sign-in succeeds and the response says a password change is owed

#### Scenario: Working before changing it

- **WHEN** that account calls any other endpoint before changing its password
- **THEN** the system responds with HTTP 403 and a code naming the reason

#### Scenario: Changing it

- **WHEN** that account supplies a new password
- **THEN** the change succeeds, the mark is cleared, and its requests are answered normally

#### Scenario: Reset by the owner

- **WHEN** an owner resets that account's password
- **THEN** the mark is set again and the account must change it at next sign-in

### Requirement: Anyone signed in can change their own password

The system SHALL allow any authenticated account to change its own password,
and SHALL NOT allow it to change anybody else's.

The CURRENT password SHALL be required — except of an account that still owes a
change, which SHALL be able to set a new one without repeating the password it
was issued. That account holds a password somebody else chose and read to them,
and typed it moments ago to sign in; asking for it again checks nothing the
sign-in did not, while stranding anybody who mistypes a string they never
picked. Everywhere else it is required, because an access token left behind on
a shared machine must not be enough to take an account over permanently.

Which case applies SHALL be decided from the ACCOUNT, never from the request:
leaving the field out cannot opt a caller out of the check.

Changing a password SHALL revoke that account's other sessions. A password is
changed because it may be known to somebody else, and leaving their session
alive undoes the change.

#### Scenario: An owner changes their own password

- **WHEN** an authenticated owner supplies their current and a new password
- **THEN** it is changed, and their other sessions stop working

#### Scenario: A first change needs no current password

- **WHEN** an account that owes a password change supplies only a new password
- **THEN** it is changed

#### Scenario: A later change without the current password

- **WHEN** an account that owes nothing tries to change its password without supplying the current one
- **THEN** the system refuses, and nothing changes

#### Scenario: The wrong current password

- **WHEN** the current password given does not match
- **THEN** the system responds with HTTP 401 and nothing changes

#### Scenario: Changing somebody else's

- **WHEN** a request tries to change the password of another account
- **THEN** it is refused; the endpoint acts only on the caller
