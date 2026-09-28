## ADDED Requirements

### Requirement: The owner manages staff from a screen of their own

The application SHALL give an `owner` a screen listing staff accounts with, for
each, the person's name and phone number, their role, the buildings they cover,
and whether the account can still sign in.

The screen SHALL be reachable only by an owner, and SHALL NOT appear in the
navigation for any other role.

Creating an account SHALL ask for a name, a phone number and a role, and nothing
else. The password is the system's to generate.

#### Scenario: Seeing the staff

- **WHEN** the owner opens the staff screen
- **THEN** each account is listed with its role, its buildings and whether it is active

#### Scenario: Not offered to staff

- **WHEN** a manager or maintenance account is signed in
- **THEN** the staff screen is neither shown in the navigation nor reachable by its address

#### Scenario: Creating an account

- **WHEN** the owner creates a manager with a name and phone number
- **THEN** the account appears in the list

### Requirement: The generated password is shown once, and said to be shown once

On creating an account or resetting its password, the application SHALL show the
generated password, offer to copy it in one action, and state plainly that it
will not be shown again.

It SHALL NOT be shown anywhere else afterwards — not on the list, not on the
account, not after a reload.

#### Scenario: After creating

- **WHEN** an account has just been created
- **THEN** the password is on screen, copyable, with a line saying it cannot be shown again

#### Scenario: After a reload

- **WHEN** the owner reloads the screen
- **THEN** the password is gone, and the account reads as any other

#### Scenario: Forgotten

- **WHEN** the owner resets a staff member's password
- **THEN** a new one is shown once, the same way, with the same warning

### Requirement: Buildings are assigned from the same screen

The application SHALL let the owner change which buildings a staff account
covers, showing what they cover now.

An account covering no buildings SHALL say so rather than showing an empty
space: a manager assigned to nothing sees nothing, which reads as a broken
screen to whoever is holding it.

Deactivating an account SHALL confirm first, and SHALL say what it does — the
person can no longer sign in, and any session they have open stops working.

#### Scenario: Assigning

- **WHEN** the owner assigns a building to a manager
- **THEN** it appears among the buildings that manager covers

#### Scenario: Covering nothing

- **WHEN** a staff account has no buildings
- **THEN** the screen says so, and says what it means for that person

#### Scenario: Deactivating

- **WHEN** the owner deactivates an account and confirms
- **THEN** it is marked as unable to sign in, and the screen says so
