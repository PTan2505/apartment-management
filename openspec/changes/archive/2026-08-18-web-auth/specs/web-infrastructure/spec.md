## MODIFIED Requirements

### Requirement: API failures are normalized before reaching application code

The application SHALL translate every failed API response into a single consistent error representation carrying the HTTP status, the backend's error code, and its human-readable message, preserving any field-level details the backend supplied. A failure with no usable response body — a network failure, a timeout, or a non-conforming response — SHALL produce the same representation rather than a differently shaped value.

Screens SHALL be able to distinguish a validation failure, an authorization failure, a missing resource, and a conflict from this representation alone, without inspecting the raw response.

A failure SHALL additionally be classified by whether the request reached the application at all. A request that was rejected by the application is distinct from one that never arrived, and the two SHALL be distinguishable from the error alone, because they warrant different handling: a rejection is deterministic, while a request that did not arrive may succeed on a later attempt.

Because a proxy stands between the browser and the API, a request that fails to reach the API does not necessarily fail without a response — the proxy answers in its place. A gateway-level failure carrying no application error body SHALL therefore be classified as not having reached the application, the same as a failure with no response at all. A failure carrying the application's own error body SHALL be classified as a rejection, however severe its status.

#### Scenario: A structured backend error is normalized

- **WHEN** an API request fails and the backend returns its standard error body
- **THEN** the resulting error carries the HTTP status, the backend's code, its message, and any field-level details

#### Scenario: A network failure is normalized

- **WHEN** an API request fails without any response — the request could not be delivered, or timed out
- **THEN** the resulting error has the same shape as a structured backend error, and identifies itself as not having reached the application rather than reporting a misleading status

#### Scenario: The API is unreachable behind the proxy

- **WHEN** an API request fails at the gateway with no application error body, because the API is not running
- **THEN** the resulting error identifies itself as not having reached the application, rather than as a rejection by it

#### Scenario: A genuine server fault is still a rejection

- **WHEN** an API request fails with a server error that carries the application's own error body
- **THEN** the resulting error is classified as a rejection by the application, not as a failure to reach it

#### Scenario: A non-conforming response is normalized

- **WHEN** an API request fails with a response whose body does not match the backend's error shape
- **THEN** the resulting error still carries the HTTP status and a usable message rather than propagating the raw body

#### Scenario: A validation failure exposes its field details

- **WHEN** an API request fails validation and the backend returns field-level details
- **THEN** those details are reachable from the normalized error so a form can attribute each message to its field

### Requirement: Destinations are addressable and restorable

Each destination the shell navigates to SHALL have its own address. Navigating SHALL update that address, entering an address directly SHALL open the corresponding destination, and the browser's back and forward controls SHALL move between visited destinations.

Opening a destination's address requires a session. Where none exists the address SHALL be remembered and the visitor sent to sign in, after which the remembered destination SHALL open — so an address remains restorable, but by way of signing in rather than directly.

An address that matches no destination SHALL produce an explicit not-found result within the shell rather than a blank screen or an error.

#### Scenario: Navigating updates the address

- **WHEN** a destination is selected
- **THEN** the browser address reflects that destination

#### Scenario: Entering an address opens its destination

- **WHEN** an address for a destination is opened directly by a visitor with a session
- **THEN** the application renders that destination within the shell

#### Scenario: Entering an address without a session

- **WHEN** an address for a destination is opened directly by a visitor with no session
- **THEN** the address is remembered, the visitor is sent to sign in, and that destination opens once they have signed in

#### Scenario: Back returns to the previous destination

- **WHEN** the browser's back control is used after navigating between destinations
- **THEN** the application returns to the previously visited destination

#### Scenario: An unknown address is handled explicitly

- **WHEN** an address matching no destination is opened by a visitor with a session
- **THEN** the application renders an explicit not-found result within the shell, with the navigation still usable
