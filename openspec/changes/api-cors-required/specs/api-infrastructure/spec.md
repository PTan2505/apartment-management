## MODIFIED Requirements

### Requirement: The API names the browser origins it accepts

The system SHALL accept cross-origin browser requests only from configured origins, and SHALL permit credentials from them.

A wildcard origin lets any page on the internet call this API from a visitor's browser. Nothing leaks through it today, because the access token travels in a header that a hostile page cannot cause a browser to attach — but it is a permission granted for no reason, and browsers refuse to send credentials to a wildcard origin at all, so it is also what stops a cross-site session from working.

More than one origin SHALL be configurable. The owner's application and the tenant portal are deployed separately and both call this API.

**In production, the system SHALL refuse to start with no origins configured.** The previous rule — no origins meaning any origin — described a permission that permits nothing: every real client of this API signs in, signing in sends credentials, and a browser will not send credentials to a wildcard. A deployment left unconfigured therefore does not get a permissive API, it gets one whose front end cannot sign in, and it discovers this at a user's first attempt rather than at startup.

Refusing to start is the same treatment this system already gives a partial payment configuration and a cross-site cookie setting that cannot take effect: a setting that cannot work fails where somebody is watching.

**Outside production, no origins configured SHALL mean the requesting origin is accepted, with credentials.** Requiring configuration to run the API on a laptop would be a daily cost for a protection that matters once deployed — but the permission granted has to be one that works, or local behaviour and deployed behaviour differ in a way only the deployment reveals.

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

#### Scenario: Production with nothing configured

- **WHEN** the system is started in production with no origins configured
- **THEN** it refuses to start, and says which setting is missing and why

#### Scenario: Development

- **WHEN** the system runs outside production with no origins configured, and a browser calls it from some origin
- **THEN** that origin is accepted, and credentials are permitted from it — not a wildcard, which a browser will not send credentials to

#### Scenario: A locally built bundle can sign in

- **WHEN** a production build of the front end is served locally and calls the API on another port with no origins configured
- **THEN** signing in succeeds, rather than failing in a way that only appears outside the dev proxy
