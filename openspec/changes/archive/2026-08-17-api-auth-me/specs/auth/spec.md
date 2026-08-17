## ADDED Requirements

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
