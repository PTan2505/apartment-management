## ADDED Requirements

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
