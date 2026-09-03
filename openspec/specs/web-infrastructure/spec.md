## Purpose

Defines the cross-cutting foundations every screen of the browser application relies on: how it reaches the API without breaking cookie-based session handling, how API errors and monetary values are normalized before any screen sees them, and how the application shell adapts its navigation between desktop and mobile viewports.

## Requirements

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

### Requirement: Monetary values are numbers before any screen uses them

Monetary values SHALL be numbers wherever application code reads them, so that no screen performs arithmetic, comparison, or sorting on a monetary string.

The API transports them as numbers, so the application SHALL rely on that rather than converting them itself. A client-side conversion step would be a second place for the rule to be applied inconsistently, and would silently mask the API regressing.

Identifiers, room codes, phone numbers, and any other digit-bearing text SHALL remain text, because coercing them would corrupt values whose leading zeros or length are significant.

Displaying a monetary value SHALL NOT change it. Values are recorded at differing precisions — whole-unit amounts and fractional rates — and a single display rule cannot be correct for both: rounding applied to an amount is harmless, while the same rounding applied to a rate shows a value that was never entered. Formatting SHALL therefore preserve the precision the value carries.

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
- **THEN** application code reads it as absent or null rather than as zero

#### Scenario: Amounts are formatted for display without being reinterpreted

- **WHEN** a monetary value is shown to the user
- **THEN** it is formatted as currency for presentation, and that formatting does not alter the underlying value used for arithmetic or ordering

#### Scenario: A fractional value is not rounded away by display

- **WHEN** a monetary value carrying a fractional part is displayed
- **THEN** the displayed figure represents that value including its fraction, rather than a rounded figure the user never entered

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

### Requirement: The application presents itself in Vietnamese

Every string the owner reads SHALL be in Vietnamese: labels, buttons, headings, helper text, empty states, confirmations, validation messages, and the navigation.

The application is used to run a Vietnamese business by a Vietnamese owner. English was tolerable while the screens were being built and read by whoever built them; it stops being tolerable the moment the figures on them are the ones somebody's income depends on.

Where a message originates in the API and reaches the screen unaltered, the screen SHALL NOT be required to translate it. Whether the API speaks Vietnamese is a separate question from whether the screens do, and a screen that can phrase its own message SHALL do so rather than passing one through.

#### Scenario: Reading any screen

- **WHEN** the owner opens any screen in the application
- **THEN** every label, button, heading and explanatory line is in Vietnamese

#### Scenario: A form refuses what the owner entered

- **WHEN** a form rejects a value it can judge itself
- **THEN** the reason is given in Vietnamese

#### Scenario: A screen has nothing to show

- **WHEN** a list has no rows
- **THEN** what it says is in Vietnamese

### Requirement: Domain terms use one agreed vocabulary

The application SHALL use a single word for each domain concept across every screen.

This matters more than the translation itself. The same idea appears on six screens — a tenancy, a bill, a deposit, a meter reading — and translated screen by screen it acquires a different name on each. A reader who meets one word on the leases screen and another on the invoices screen cannot tell whether they are the same thing, and will eventually decide they are not.

The vocabulary SHALL distinguish concepts the system deliberately distinguishes. In particular a tenancy that was **cancelled** and one that **ended** SHALL NOT share a word, because the whole reason cancellation exists is that they are different events.

#### Scenario: The same concept on two screens

- **WHEN** the owner sees a tenancy named on the leases screen and on an invoice
- **THEN** the same word is used for it in both places

#### Scenario: Concepts the system distinguishes stay distinct

- **WHEN** the owner sees a cancelled tenancy and a finished one
- **THEN** they are named differently, as they are in the record

### Requirement: Dates and months read as a Vietnamese reader expects

The application SHALL present dates as `dd/mm/yyyy` and month names in Vietnamese.

A date shown as `August 2026` in an otherwise Vietnamese screen is a fragment the reader has to translate, and month names appear on every billing and reporting screen.

The exclusive-ending convention SHALL be unaffected: a date that ends a tenancy is still shown as the last day covered, never as the boundary the API reports.

#### Scenario: A month is named

- **WHEN** a screen names a month
- **THEN** it is named in Vietnamese

#### Scenario: An ending date

- **WHEN** a tenancy's ending is shown
- **THEN** it is still the last day covered, in Vietnamese formatting

### Requirement: The application addresses its API absolutely when deployed

The application SHALL use a configured absolute address for the API when one is given, and SHALL fall back to the relative path served by the development proxy when none is.

A relative address works only where something forwards it. In development the dev server does; in a built bundle nothing does, so a deployed application asks its own origin for the API and receives its own 404. The symptom is a sign-in that fails against an address nobody configured.

**A production build SHALL be refused where no address is configured.** An application that will ask its own origin for the API is not one to ship: the failure appears only when somebody tries to sign in, and reads as a broken deployment rather than a missing setting.

Development SHALL be unaffected. It depends on the proxy, and requiring an address to run the application locally would be a cost paid every day for a setting that matters once.

#### Scenario: Deployed with an address

- **WHEN** the application is built with an API address configured
- **THEN** its requests go to that address

#### Scenario: Built without one

- **WHEN** a production build runs with no API address configured
- **THEN** the build fails, naming the missing setting

#### Scenario: Running locally

- **WHEN** the application runs against the development server
- **THEN** it addresses the API relatively and the proxy forwards it, as before
