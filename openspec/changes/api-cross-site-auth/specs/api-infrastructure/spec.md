## ADDED Requirements

### Requirement: The API names the browser origins it accepts

The system SHALL accept cross-origin browser requests only from configured origins, and SHALL permit credentials from them.

A wildcard origin lets any page on the internet call this API from a visitor's browser. Nothing leaks through it today, because the access token travels in a header that a hostile page cannot cause a browser to attach — but it is a permission granted for no reason, and browsers refuse to send credentials to a wildcard origin at all, so it is also what stops a cross-site session from working.

More than one origin SHALL be configurable. The owner's application and the tenant portal are deployed separately and both call this API.

**Where no origins are configured, the system SHALL accept any origin.** That is what local development depends on, and requiring configuration to run the API on a laptop would be a cost paid every day for a protection that matters only once deployed.

An origin that is not allowed SHALL simply not be granted access; the API SHALL NOT treat it as an error worth failing a request over, since the browser is what enforces the outcome.

#### Scenario: A configured origin

- **WHEN** a browser on a configured origin calls the API
- **THEN** the request is permitted and credentials are allowed

#### Scenario: Two surfaces

- **WHEN** the owner's application and the tenant portal are on different origins and both are configured
- **THEN** both are permitted

#### Scenario: An origin that was not configured

- **WHEN** a browser on some other origin calls the API
- **THEN** it is not granted cross-origin access

#### Scenario: Development

- **WHEN** the system runs with no origins configured
- **THEN** any origin is accepted, as it is today
