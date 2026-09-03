## ADDED Requirements

### Requirement: The refresh cookie's cross-site behaviour is configurable

The system SHALL allow the refresh cookie's `SameSite` attribute to be configured, and SHALL default it to `Strict`.

Whether the application and the API are on the same site is a fact about where they are deployed, and the API cannot see it. Serving them from one host and serving them from Vercel and Render are both legitimate, and they need different values — so the value is stated in configuration rather than inferred from something that happens to correlate with it.

`Strict` remains the default because it is the safer of the two and the correct one for a same-site deployment. A deployment that needs otherwise says so.

**The system SHALL refuse to start with `SameSite=None` where the cookie is not also `Secure`.** Browsers discard that combination silently, so the failure would otherwise appear as a login that works once and cannot be renewed — with nothing anywhere reporting a cause.

#### Scenario: Default behaviour

- **WHEN** the system starts with no cross-site setting configured
- **THEN** the refresh cookie is issued with `SameSite=Strict`, as before

#### Scenario: Configured for a cross-site deployment

- **WHEN** the system is configured for cross-site cookies and is serving securely
- **THEN** the refresh cookie is issued with `SameSite=None` and `Secure`

#### Scenario: An unusable combination is refused

- **WHEN** the system is configured for cross-site cookies without secure delivery
- **THEN** it refuses to start, naming the reason

#### Scenario: The cookie's other protections are unchanged

- **WHEN** a refresh cookie is issued under any configuration
- **THEN** it remains `httpOnly` and scoped to the refresh and logout paths
