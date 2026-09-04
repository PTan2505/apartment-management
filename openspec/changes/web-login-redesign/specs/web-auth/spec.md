## MODIFIED Requirements

### Requirement: A user signs in with a phone number and password

The application SHALL provide a sign-in screen taking a phone number and a password, presented without the application shell so that no navigation to unreachable destinations is offered.

The screen SHALL require both fields to be non-empty before submitting, and SHALL NOT impose any further constraint on their form. The API is the authority on whether credentials are valid, and a stricter client-side rule would reject credentials the API would have accepted.

When credentials are rejected, the application SHALL display the message the API returned, unchanged, so it does not reveal whether the phone number itself exists.

While a sign-in attempt is in flight the screen SHALL indicate that, and SHALL prevent the same attempt being submitted twice.

**The password SHALL be concealed by default, and the screen SHALL offer a way to reveal it.** A password typed on a phone keyboard, unread, is a password whose failure cannot be told apart from a forgotten one — and the message on rejection deliberately does not distinguish the two, so nothing else on the screen does either. Revealing SHALL be a deliberate act, never the initial state, and SHALL NOT persist across a reload: the reason to reveal a password is to check what was just typed, and it ends there.

The control SHALL say which state it will produce rather than which state the field is in, since the two are opposites and a reader given the wrong one hides a password they meant to check.

#### Scenario: Successful sign-in

- **WHEN** a user submits a correct phone number and password
- **THEN** a session is established and the user is taken into the application

#### Scenario: Rejected credentials

- **WHEN** a user submits a phone number or password the API rejects
- **THEN** the screen shows the message the API returned and the user remains on the sign-in screen with no session established

#### Scenario: Rejection does not reveal whether the account exists

- **WHEN** a user submits an unknown phone number, and separately submits a known phone number with the wrong password
- **THEN** the screen shows the same message in both cases

#### Scenario: Empty fields are rejected before submitting

- **WHEN** a user submits the form with either field empty
- **THEN** the screen reports which field is required and no request is made

#### Scenario: A valid credential form is not rejected by the client

- **WHEN** a user enters a phone number or password in any format that the API would accept
- **THEN** the screen submits it rather than rejecting it against a stricter local rule

#### Scenario: Submission in progress

- **WHEN** a sign-in attempt is in flight
- **THEN** the screen indicates it and a second submission of the same attempt is prevented

#### Scenario: The server cannot be reached

- **WHEN** a sign-in attempt fails without any response from the server
- **THEN** the screen reports a connection problem rather than presenting it as rejected credentials

#### Scenario: The password starts concealed

- **WHEN** the sign-in screen is opened
- **THEN** the password field conceals what is typed into it

#### Scenario: Revealing the password

- **WHEN** the user asks to see the password they have typed
- **THEN** it becomes readable, and the control then offers to conceal it again

#### Scenario: Revealing does not outlive the screen

- **WHEN** the user reveals the password and then reloads the sign-in screen
- **THEN** the password is concealed again
