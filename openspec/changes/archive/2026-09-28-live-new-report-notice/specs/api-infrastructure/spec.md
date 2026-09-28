## ADDED Requirements

### Requirement: The API can push events to a signed-in account

The system SHALL accept WebSocket connections on a dedicated path and SHALL
deliver events to the accounts entitled to them.

A connection SHALL be unauthenticated until it presents a valid access token in
its first message, and SHALL be closed if it does not present one within a few
seconds. The token SHALL NOT be accepted in the URL: the request line is written
to the access log on every connection, and a token in a log is a token that
outlives its session.

An account whose access token expires SHALL be able to present a new one on the
same connection. A connection whose token has expired and has not been renewed
SHALL be closed rather than left open and trusted on the strength of a
credential that is no longer valid.

Events SHALL be addressed by account, and SHALL carry no more than the client
needs to ask the API for the rest. A push is a signal that something changed,
not a second way of reading data that the endpoints already answer for.

Delivery SHALL be best-effort. Nothing in the system may depend on an event
arriving: a client that was offline SHALL be able to establish the same facts by
asking.

#### Scenario: Connecting and authenticating

- **WHEN** a client connects and sends a valid access token
- **THEN** the connection is accepted and begins receiving that account's events

#### Scenario: Connecting without a token

- **WHEN** a client connects and sends nothing
- **THEN** the connection is closed shortly afterwards

#### Scenario: An invalid token

- **WHEN** a client presents a token that is not valid
- **THEN** the connection is closed and no event is ever sent on it

#### Scenario: A token in the URL

- **WHEN** a client puts an access token in the connection's query string
- **THEN** it is not accepted as authentication

#### Scenario: Renewing on the same connection

- **WHEN** a client presents a freshly renewed access token before the old one expires
- **THEN** the connection stays open and keeps receiving events

#### Scenario: Nothing depends on the push

- **WHEN** a client is not connected at the moment an event occurs
- **THEN** the same fact is still available from the ordinary endpoints
