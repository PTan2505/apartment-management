## MODIFIED Requirements

### Requirement: The portal reaches the API by an absolute address

The application SHALL address the API by a full address supplied at build time, rather than by a path on its own origin, and SHALL use the same address the rest of the application uses.

It sends no cookie and carries its token in a header, so nothing about it depends on sharing an origin with the API.

One address rather than two: a second setting naming the same API is a second thing to configure, a second thing to get wrong, and nothing distinguishes the two values in practice.

An absent or empty address SHALL fail the build rather than produce an application that requests paths on itself.

#### Scenario: Requests reach the API

- **WHEN** the built application makes an API request
- **THEN** it is addressed to the API's own origin

#### Scenario: A missing address

- **WHEN** the application is built without the API address configured
- **THEN** the build fails

## ADDED Requirements

### Requirement: The portal is a route in the application

The portal SHALL be a route within the owner's application rather than a separate build, and SHALL be reached without signing in.

Two applications were two of everything — two configs, two entries, two build scripts, two API addresses, two CI steps — for a separation whose only remaining benefit is the size of what a tenant downloads. That benefit is real and was weighed: a tenant now receives the whole application rather than the portal alone. It was accepted as the price of one thing to build, configure and deploy.

**The portal SHALL NOT use the owner's API client.** That client renews the session when a request is refused, and a tenant has no session to renew — sharing it would need a flag saying a request is not really authenticated, which is the kind of thing that gets forgotten. The portal keeps its own module: no interceptor, no cookie.

**The portal SHALL NOT sit within whatever establishes the owner's session.** That asks the API who is signed in as soon as it mounts; for a tenant the answer is nobody, and the attempt costs a refused request and a refused renewal before a bill appears.

A tenant SHALL reach it without passing the sign-in guard, and SHALL NOT be redirected to sign in.

#### Scenario: Opening a link

- **WHEN** a tenant opens their link
- **THEN** the portal loads and shows their bills, without a sign-in screen

#### Scenario: Nothing asks who the tenant is

- **WHEN** a tenant opens their link
- **THEN** no request is made to establish an owner session, and none is renewed

#### Scenario: A refused request is not retried as a session

- **WHEN** a portal request is refused because the token is no longer valid
- **THEN** the portal reports it, and nothing attempts to renew a session
