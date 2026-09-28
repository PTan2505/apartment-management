## ADDED Requirements

### Requirement: An account owing a password change is sent to change it

When signing in reports that a password change is owed, the application SHALL
take the person straight to a screen that changes it, and SHALL keep them there
until it is done.

It SHALL say why: the password was issued by the owner and is known to somebody
else. A screen that demands a new password without saying why reads as an
obstacle rather than a precaution.

Where a request is refused because the change is still owed, the application
SHALL go to that screen rather than reporting a permission error, which names
something the person cannot act on.

#### Scenario: First sign-in

- **WHEN** a staff account signs in with the password the owner gave them
- **THEN** the change-password screen opens, saying why

#### Scenario: Trying to go elsewhere

- **WHEN** that person navigates to any other screen before changing it
- **THEN** they are returned to the change-password screen

#### Scenario: After changing it

- **WHEN** the new password is accepted
- **THEN** they arrive at the screen their role starts on, with no further prompt

### Requirement: Anybody signed in can change their own password

The application SHALL offer a change-password screen to any signed-in account,
reached from where the account's own name is shown.

It SHALL ask for the current password and the new one, SHALL report a wrong
current password as exactly that, and SHALL say that other sessions will stop
working.

#### Scenario: An owner changes their password

- **WHEN** an owner opens it from their own name and supplies both passwords
- **THEN** the password is changed and the screen says so

#### Scenario: The current password is wrong

- **WHEN** the current password does not match
- **THEN** the screen says so, and nothing is changed
