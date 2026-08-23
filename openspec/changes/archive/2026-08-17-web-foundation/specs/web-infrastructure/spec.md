## Purpose

Defines the cross-cutting foundations every screen of the browser application relies on: how it reaches the API without breaking cookie-based session handling, how API errors and monetary values are normalized before any screen sees them, and how the application shell adapts its navigation between desktop and mobile viewports.

## ADDED Requirements

### Requirement: The browser reaches the API as a single origin

The browser application SHALL issue API requests to the same origin that served the application, and that origin SHALL forward them to the backend. Credentialed requests — those that must send or store the session cookie — SHALL therefore be first-party, and the application SHALL NOT depend on cross-origin credential negotiation.

This exists because the backend delivers its refresh token as an `httpOnly` cookie. A cross-origin arrangement would require the backend to permit credentials for a named origin, and would leave the cookie's `SameSite` protections depending on the two parts sharing a site — a condition that holds in local development by accident and fails in most deployments.

#### Scenario: An API request is same-origin from the browser's perspective

- **WHEN** the browser application issues any API request
- **THEN** the request targets the origin that served the application, and the browser applies no cross-origin preflight or credential restriction to it

#### Scenario: A cookie set by the API is stored and returned

- **WHEN** an API response sets a cookie and a later request is made to a path that cookie is scoped to
- **THEN** the browser stores the cookie and includes it on that later request

#### Scenario: The backend requires no cross-origin configuration

- **WHEN** the browser application is run against the backend
- **THEN** it functions without the backend permitting credentials for a named browser origin

### Requirement: API failures are normalized before reaching application code

The application SHALL translate every failed API response into a single consistent error representation carrying the HTTP status, the backend's error code, and its human-readable message, preserving any field-level details the backend supplied. A failure with no usable response body — a network failure, a timeout, or a non-conforming response — SHALL produce the same representation rather than a differently shaped value.

Screens SHALL be able to distinguish a validation failure, an authorization failure, a missing resource, and a conflict from this representation alone, without inspecting the raw response.

#### Scenario: A structured backend error is normalized

- **WHEN** an API request fails and the backend returns its standard error body
- **THEN** the resulting error carries the HTTP status, the backend's code, its message, and any field-level details

#### Scenario: A network failure is normalized

- **WHEN** an API request fails without any response — the request could not be delivered, or timed out
- **THEN** the resulting error has the same shape as a structured backend error, and identifies itself as a transport failure rather than reporting a misleading status

#### Scenario: A non-conforming response is normalized

- **WHEN** an API request fails with a response whose body does not match the backend's error shape
- **THEN** the resulting error still carries the HTTP status and a usable message rather than propagating the raw body

#### Scenario: A validation failure exposes its field details

- **WHEN** an API request fails validation and the backend returns field-level details
- **THEN** those details are reachable from the normalized error so a form can attribute each message to its field

### Requirement: Monetary values are numbers before any screen uses them

The backend transports monetary values as strings. The application SHALL convert them to numbers at the boundary between the API client and application code, so that no screen performs arithmetic, comparison, or sorting on a monetary string.

Conversion SHALL be applied only to values that are monetary. Identifiers, room codes, phone numbers, and any other digit-bearing text SHALL be left as text, because coercing them would corrupt values whose leading zeros or length are significant.

#### Scenario: A monetary value is a number in application code

- **WHEN** application code reads a monetary field from an API response
- **THEN** the value is a number, and arithmetic and numeric comparison on it produce correct results

#### Scenario: Monetary values sort numerically

- **WHEN** a set of records is ordered by a monetary field
- **THEN** the ordering is numeric, so a larger amount never sorts below a smaller one because of its text form

#### Scenario: A digit-bearing identifier is not coerced

- **WHEN** application code reads a phone number, room code, or other digit-bearing text field from an API response
- **THEN** the value remains text, retaining any leading zeros and its exact original form

#### Scenario: An absent monetary value survives conversion

- **WHEN** a monetary field is absent or null in an API response
- **THEN** it remains absent or null rather than becoming zero or a non-numeric value

### Requirement: The application shell adapts its navigation to viewport width

The application SHALL present a persistent shell containing navigation and a content area, and that navigation SHALL take a different form on wide and narrow viewports.

On a wide viewport the navigation SHALL be permanently visible alongside the content. On a narrow viewport it SHALL be hidden by default, opened by an explicit control, presented over the content, and dismissed both by selecting a destination and by dismissing it directly — so that navigating never leaves it obscuring the content it navigated to.

The shell SHALL indicate which destination is currently active in both forms.

#### Scenario: Wide viewport shows navigation permanently

- **WHEN** the application is viewed on a wide viewport
- **THEN** the navigation is visible alongside the content without any action, and no control to open it is offered

#### Scenario: Narrow viewport hides navigation behind a control

- **WHEN** the application is viewed on a narrow viewport
- **THEN** the navigation is not visible, the content occupies the full width, and a control to open the navigation is offered

#### Scenario: Opening and dismissing navigation on a narrow viewport

- **WHEN** the control is used on a narrow viewport
- **THEN** the navigation appears over the content, and dismissing it directly returns to the content unchanged

#### Scenario: Selecting a destination on a narrow viewport dismisses the navigation

- **WHEN** a destination is selected from the opened navigation on a narrow viewport
- **THEN** the application navigates to that destination and the navigation closes

#### Scenario: Resizing across the breakpoint

- **WHEN** the viewport is resized from narrow to wide while the navigation is open
- **THEN** the navigation settles into its permanent form rather than remaining as an overlay

#### Scenario: The active destination is indicated

- **WHEN** the application is showing a destination
- **THEN** that destination is distinguished from the others in the navigation, in both the wide and narrow forms

#### Scenario: Content never scrolls horizontally

- **WHEN** the application is viewed at any viewport width down to a small phone
- **THEN** the shell itself does not scroll horizontally, and any content too wide to fit scrolls within its own bounds

### Requirement: Destinations are addressable and restorable

Each destination the shell navigates to SHALL have its own address. Navigating SHALL update that address, entering an address directly SHALL open the corresponding destination, and the browser's back and forward controls SHALL move between visited destinations.

An address that matches no destination SHALL produce an explicit not-found result within the shell rather than a blank screen or an error.

#### Scenario: Navigating updates the address

- **WHEN** a destination is selected
- **THEN** the browser address reflects that destination

#### Scenario: Entering an address opens its destination

- **WHEN** an address for a destination is opened directly
- **THEN** the application renders that destination within the shell

#### Scenario: Back returns to the previous destination

- **WHEN** the browser's back control is used after navigating between destinations
- **THEN** the application returns to the previously visited destination

#### Scenario: An unknown address is handled explicitly

- **WHEN** an address matching no destination is opened
- **THEN** the application renders an explicit not-found result within the shell, with the navigation still usable

### Requirement: Server data is fetched through one shared mechanism

All API-backed data SHALL be fetched through a single shared mechanism that caches responses, deduplicates concurrent requests for the same data, and exposes loading and error states to screens uniformly. A screen SHALL NOT hold fetched server data in its own local state as the source of truth.

That mechanism SHALL apply consistent defaults for retry behavior, and SHALL NOT retry a request that failed because it was rejected rather than because it did not arrive — a validation, authorization, or not-found failure is not made correct by repetition.

#### Scenario: Concurrent requests for the same data are deduplicated

- **WHEN** two parts of the application request the same data at the same time
- **THEN** one API request is issued and both receive the result

#### Scenario: Loading and error states are available uniformly

- **WHEN** a screen requests API-backed data
- **THEN** it can render a loading state while the request is in flight and a normalized error if it fails, without implementing that handling itself

#### Scenario: A rejected request is not retried

- **WHEN** a request fails with a client error such as a validation, authorization, or not-found failure
- **THEN** it is not retried automatically

#### Scenario: Data is refetched after it changes

- **WHEN** an operation modifies data that has been fetched and cached
- **THEN** the affected data is refetched or invalidated so screens do not display a stale value
