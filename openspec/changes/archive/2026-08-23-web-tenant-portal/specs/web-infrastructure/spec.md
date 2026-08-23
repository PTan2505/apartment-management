## MODIFIED Requirements

### Requirement: The browser reaches the API as a single origin

**The application that carries a session** SHALL issue API requests to the same origin that served it, and that origin SHALL forward them to the backend. Credentialed requests — those that must send or store the session cookie — SHALL therefore be first-party, and that application SHALL NOT depend on cross-origin credential negotiation.

This exists because the backend delivers its refresh token as an `httpOnly` cookie. A cross-origin arrangement would require the backend to permit credentials for a named origin, and would leave the cookie's `SameSite` protections depending on the two parts sharing a site — a condition that holds in local development by accident and fails in most deployments.

**A browser application that carries no session is exempt**, and the tenant portal is one: it holds no cookie, sends its token in a request header, and has nothing for a `SameSite` rule to protect. Requiring it to share an origin would mean putting a proxy in front of a page that needs none, for a protection it does not use.

The distinction is which credential is in play, not which application. Any future client that acquires a session cookie falls back under the first paragraph.

#### Scenario: An API request is same-origin from the browser's perspective

- **WHEN** the application that carries a session issues any API request
- **THEN** the request targets the origin that served the application, and the browser applies no cross-origin preflight or credential restriction to it

#### Scenario: A cookie set by the API is stored and returned

- **WHEN** an API response sets a cookie and a later request is made to a path that cookie is scoped to
- **THEN** the browser stores the cookie and includes it on that later request

#### Scenario: The backend requires no cross-origin configuration

- **WHEN** the browser application is run against the backend
- **THEN** it functions without the backend permitting credentials for a named browser origin

#### Scenario: A sessionless application addresses the API directly

- **WHEN** a browser application that holds no session cookie issues an API request
- **THEN** it may address the API's own origin, because no credential of the browser's is at stake
