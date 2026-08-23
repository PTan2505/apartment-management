## Purpose

Defines how a caller proves their identity to the API (login), how that identity is kept valid across requests without re-entering credentials (access/refresh tokens), and how a session is ended (logout) or rejected (invalid credentials, expired/revoked tokens).

## Requirements

### Requirement: Owner login with phone and password
The system SHALL allow a user with the `owner` role to authenticate using their phone number and password, and SHALL reject authentication attempts with incorrect credentials or for users without a usable password (e.g. `customer` role accounts).

#### Scenario: Successful login
- **WHEN** an `owner` submits their correct phone number and password to the login endpoint
- **THEN** the system responds with HTTP 200, an access token in the response body, and sets a refresh token cookie

#### Scenario: Incorrect password
- **WHEN** a user submits a phone number that exists with an incorrect password
- **THEN** the system responds with HTTP 401 and does not indicate whether the phone number itself was valid

#### Scenario: Unknown phone number
- **WHEN** a user submits a phone number that has no matching account
- **THEN** the system responds with HTTP 401 with the same error shape as an incorrect password, so callers cannot enumerate valid phone numbers

#### Scenario: Account without a usable password
- **WHEN** a user submits credentials for an account that has no password set (e.g. a `customer` record)
- **THEN** the system responds with HTTP 401

### Requirement: Access token issuance and verification
The system SHALL issue a short-lived access token upon successful login and SHALL require a valid, unexpired access token to access any endpoint that depends on the shared authentication middleware.

#### Scenario: Valid access token on a protected endpoint
- **WHEN** a request includes a valid, unexpired access token identifying the caller
- **THEN** the system allows the request to proceed and makes the caller's identity (user id and role) available to the endpoint

#### Scenario: Missing or expired access token on a protected endpoint
- **WHEN** a request to an endpoint requiring authentication has no access token, a malformed token, or an expired token
- **THEN** the system responds with HTTP 401 and does not process the request

### Requirement: Refresh token issuance and renewal
The system SHALL issue a long-lived refresh token alongside each successful login and SHALL allow the caller to exchange a valid refresh token for a new access token without re-entering credentials, without changing or replacing the refresh token itself.

#### Scenario: Valid refresh token exchanged for a new access token
- **WHEN** a caller presents a refresh token that is valid, unexpired, and not revoked
- **THEN** the system responds with HTTP 200 and a new access token, and the original refresh token remains valid and unchanged for future use until it expires or is revoked

#### Scenario: Expired refresh token
- **WHEN** a caller presents a refresh token past its expiration
- **THEN** the system responds with HTTP 401 and does not issue a new access token

#### Scenario: Revoked refresh token
- **WHEN** a caller presents a refresh token that has been revoked (e.g. via logout)
- **THEN** the system responds with HTTP 401 and does not issue a new access token

#### Scenario: Unrecognized refresh token
- **WHEN** a caller presents a refresh token that does not match any issued token
- **THEN** the system responds with HTTP 401

### Requirement: Logout revokes a single session
The system SHALL allow a caller to end their current session by revoking the specific refresh token used, without affecting refresh tokens issued to the same user from other logins/devices.

#### Scenario: Logout revokes only the current session
- **WHEN** a caller logs out while presenting a valid refresh token
- **THEN** the system marks that specific refresh token as revoked, responds with HTTP 200, and any other active refresh tokens for the same user remain valid

#### Scenario: Revoked token can no longer be used
- **WHEN** a caller attempts to refresh or use an already-revoked refresh token
- **THEN** the system responds with HTTP 401

### Requirement: Authenticated caller can retrieve their own account

The system SHALL provide an endpoint that returns the account of the user identified by the presented access token. The response SHALL include the user's id, phone number, full name, role, and creation and update timestamps.

The response SHALL NOT include password material under any circumstance. Fields SHALL be selected explicitly rather than removed after retrieval, so a column added to the user record later cannot leak by default.

The endpoint SHALL identify the caller solely from the access token, and SHALL ignore any user identifier supplied by the caller, so that one user cannot read another user's account through it.

The endpoint SHALL be available to any authenticated user regardless of role, because it describes the caller rather than granting access to a resource.

#### Scenario: Authenticated caller retrieves their own account

- **WHEN** a caller presents a valid, unexpired access token to the endpoint
- **THEN** the system responds with HTTP 200 and the account identified by that token, including id, phone, full name, role, and timestamps

#### Scenario: Password material is never returned

- **WHEN** any successful response is returned from the endpoint
- **THEN** it contains no password hash and no other password material

#### Scenario: Unauthenticated request

- **WHEN** a request to the endpoint has no access token, a malformed token, or an expired token
- **THEN** the system responds with HTTP 401 and does not return any account

#### Scenario: Caller cannot request another user's account

- **WHEN** a caller presents a valid access token together with a user identifier for a different user
- **THEN** the system responds with the caller's own account, determined from the token, and not the account named by the identifier

#### Scenario: Account no longer exists

- **WHEN** a caller presents a valid access token whose user record has since been removed
- **THEN** the system responds with HTTP 401 rather than a server error, because the token no longer identifies anyone
