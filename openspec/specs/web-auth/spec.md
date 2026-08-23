## Purpose

Covers signing in and out of the browser application: how a session is established from a phone number and password, kept across reloads, renewed when it expires, shared consistently between open tabs, and ended deliberately or on its own.

## Requirements

### Requirement: A user signs in with a phone number and password

The application SHALL provide a sign-in screen taking a phone number and a password, presented without the application shell so that no navigation to unreachable destinations is offered.

The screen SHALL require both fields to be non-empty before submitting, and SHALL NOT impose any further constraint on their form. The API is the authority on whether credentials are valid, and a stricter client-side rule would reject credentials the API would have accepted.

When credentials are rejected, the application SHALL display the message the API returned, unchanged, so it does not reveal whether the phone number itself exists.

While a sign-in attempt is in flight the screen SHALL indicate that, and SHALL prevent the same attempt being submitted twice.

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

### Requirement: The session is restored when the application loads

On load, the application SHALL determine whether a usable session exists by asking the API to identify the current user, rather than by inspecting the stored credential itself. The answer both establishes whether the user is signed in and supplies their account details.

Until that determination completes the application SHALL show neither the sign-in screen nor protected content, so a signed-in user reloading a page never sees a sign-in screen appear and disappear.

A stored credential that is expired, revoked, or otherwise unusable SHALL be treated the same as any other unusable credential: the application attempts renewal, and only signs the user out if that also fails.

#### Scenario: A signed-in user reloads

- **WHEN** a signed-in user reloads the application
- **THEN** the session is restored and the user remains signed in, without being asked for credentials

#### Scenario: No sign-in screen flashes during restoration

- **WHEN** the application is determining whether a session exists
- **THEN** it shows neither the sign-in screen nor protected content until the determination completes

#### Scenario: A stored credential that has expired

- **WHEN** the application loads holding a stored credential that is no longer valid, while the longer-lived session is still good
- **THEN** the credential is renewed and the user remains signed in

#### Scenario: No session at all

- **WHEN** the application loads with no stored credential and no valid longer-lived session
- **THEN** the user is treated as signed out and sent to the sign-in screen

#### Scenario: The server cannot be reached during restoration

- **WHEN** the check fails without any response from the server
- **THEN** the application reports a connection problem and does not present the user as signed out

### Requirement: An expired session is renewed without interrupting the user

The application SHALL attach the stored credential to every API request. When a request is rejected because that credential is no longer valid, the application SHALL renew it and retry the original request once, so the user is not interrupted.

A retried request SHALL NOT be retried again, and the renewal request itself SHALL NOT trigger renewal, so a failing renewal cannot produce an unbounded cycle of attempts.

When renewal fails, the session SHALL end.

#### Scenario: A request is renewed and retried

- **WHEN** an API request is rejected because the credential expired, and renewal succeeds
- **THEN** the original request is retried once and its result is delivered as though it had succeeded first time

#### Scenario: Renewal fails

- **WHEN** an API request is rejected and renewal also fails
- **THEN** the session ends and the user is sent to the sign-in screen

#### Scenario: A retry is not retried

- **WHEN** a request that has already been retried after renewal is rejected again
- **THEN** it is not renewed or retried a second time

#### Scenario: Renewal does not renew itself

- **WHEN** the renewal request is itself rejected
- **THEN** it does not trigger another renewal attempt

#### Scenario: Several requests rejected at once

- **WHEN** several API requests are in flight and all are rejected because the credential expired
- **THEN** each is renewed and retried, and the user remains signed in with a usable session

### Requirement: Destinations require a session

Every destination in the application SHALL require a session. A visitor without one SHALL be sent to the sign-in screen instead, and the destination they asked for SHALL be remembered.

After signing in, the user SHALL be taken to the remembered destination rather than to the default one. Where no destination was remembered, the default SHALL be used.

A user who already has a session SHALL NOT be shown the sign-in screen; opening its address SHALL take them into the application instead.

The application shell SHALL NOT be rendered for a visitor without a session, so protected navigation is never briefly visible before the redirect.

#### Scenario: An unauthenticated visitor is redirected

- **WHEN** a visitor without a session opens a destination's address
- **THEN** they are sent to the sign-in screen and the application shell is not shown

#### Scenario: The requested destination is restored after signing in

- **WHEN** a visitor without a session opens a specific destination's address, and then signs in successfully
- **THEN** they are taken to that destination rather than to the default one

#### Scenario: Signing in without a remembered destination

- **WHEN** a user signs in having gone to the sign-in screen directly
- **THEN** they are taken to the default destination

#### Scenario: An already signed-in user opens the sign-in address

- **WHEN** a user with a session opens the sign-in screen's address
- **THEN** they are taken into the application rather than shown the sign-in screen

### Requirement: A session that ends on its own is explained

When a session ends without the user asking — because renewal failed — the application SHALL tell the user why on the sign-in screen, rather than presenting an unexplained sign-in screen.

The destination the user was on SHALL be remembered, so signing in again returns them to it.

A user who signed out deliberately SHALL NOT be shown that explanation, because nothing unexpected happened.

A visitor who never had a session SHALL NOT be shown it either. Such a visitor also fails renewal — there is nothing to renew from — but no session ended, and telling them one did is false. Their attempted destination SHALL still be remembered, by the gate that redirected them rather than by the failed renewal.

#### Scenario: Session ends mid-use

- **WHEN** a user's session ends while they are using the application
- **THEN** the sign-in screen explains that the session ended and invites them to sign in again

#### Scenario: Returning to where the session ended

- **WHEN** a user signs in again after their session ended on its own
- **THEN** they are taken back to the destination they were on

#### Scenario: A deliberate sign-out is not explained away

- **WHEN** a user signs out deliberately
- **THEN** the sign-in screen carries no session-ended explanation

#### Scenario: A visitor who never had a session is not told one ended

- **WHEN** a visitor who has never signed in opens a destination's address, and the attempt to establish a session fails
- **THEN** the sign-in screen carries no session-ended explanation, and the destination they asked for is still the one they are returned to after signing in

### Requirement: The signed-in user is identified in the application

The application SHALL show who is signed in, presenting the account's full name and phone number as reported by the API, together with a way to sign out. This SHALL be reachable at every viewport width.

Account details SHALL come from the API rather than from the stored credential, so nothing displayed depends on reading a credential the client does not verify.

#### Scenario: The signed-in account is shown

- **WHEN** a user is signed in
- **THEN** the application shows their full name, and their phone number is reachable from the same place

#### Scenario: Sign-out is reachable

- **WHEN** a user is signed in
- **THEN** a way to sign out is reachable from where their account is shown

#### Scenario: Reachable on a narrow viewport

- **WHEN** a signed-in user views the application on a narrow viewport
- **THEN** their account and the sign-out action remain reachable

### Requirement: Signing out ends the session everywhere

Signing out SHALL end the session with the API so the long-lived credential cannot be used again, discard the stored credential, and discard all data cached from the session so that no part of it is visible to whoever signs in next.

Sign-out SHALL complete from the user's point of view even if the API cannot be reached, so a user is never trapped in a session they have asked to leave.

Sign-out applies to the tab it happens in. Another tab open at the same time keeps its own credential until it reloads or that credential expires, at which point it finds the session gone and signs out. Ending every tab at the moment of sign-out is deliberately not required — it would need tabs to observe each other, and the exposure it closes is bounded by the short lifetime of the credential each already holds.

#### Scenario: Signing out

- **WHEN** a signed-in user signs out
- **THEN** the session ends, the stored credential is discarded, and the user is taken to the sign-in screen

#### Scenario: Cached data does not survive sign-out

- **WHEN** a user signs out and another user signs in afterwards
- **THEN** no data loaded during the previous session is shown at any point

#### Scenario: The long-lived credential is revoked

- **WHEN** a user signs out
- **THEN** the long-lived credential used by that session can no longer establish a new one

#### Scenario: Signing out while the server is unreachable

- **WHEN** a user signs out and the API cannot be reached
- **THEN** the local session still ends and the user is taken to the sign-in screen

#### Scenario: Another tab finds the session gone when it reloads

- **WHEN** a user signs out in one tab, and another tab of the application is reloaded afterwards
- **THEN** that tab finds no stored credential, cannot establish a session, and shows the sign-in screen
