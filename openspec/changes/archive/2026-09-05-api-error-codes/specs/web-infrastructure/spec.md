## ADDED Requirements

### Requirement: Errors from the API are read to the owner in Vietnamese

The application SHALL present every API failure in Vietnamese, phrasing it from the error's code rather than displaying the message the API returned.

This is the counterpart to the exemption that lets the API answer in whatever language it answers in. That exemption exists because the API serves callers, not readers; it stops being acceptable the moment a caller puts an API sentence in front of a person, which is what showing the message unaltered does.

Each surface SHALL be free to phrase a code for its own reader. The owner running the business and a tenant opening a link know different amounts about how the system works, and a sentence written for one is not automatically right for the other.

**A code the application has no phrase for SHALL still be reported in Vietnamese**, chosen by what kind of failure it was. Showing the API's own message in that case would put English in front of the reader precisely when something unfamiliar has gone wrong, and showing the code would put a developer's identifier there.

The application SHALL NOT be able to ship without a phrase for every code the API can return. A missing phrase is not a rare edge case to be handled at runtime — it is a gap that can be closed before anyone sees it, and a check that fails the build is the only kind nobody forgets to run.

#### Scenario: A failure the application knows

- **WHEN** a request fails with a code the application has a phrase for
- **THEN** that phrase is shown, in Vietnamese, and the API's own message is not

#### Scenario: A failure the application has never seen

- **WHEN** a request fails with a code the application has no phrase for
- **THEN** what is shown is still Vietnamese, still describes the kind of failure, and is neither the API's message nor the code itself

#### Scenario: A code added to the API without a phrase

- **WHEN** the API gains an error code and the application has no phrase for it
- **THEN** the application does not build

#### Scenario: Two surfaces, one code

- **WHEN** the same failure is shown to the owner and to a tenant
- **THEN** each may be given wording suited to its reader

#### Scenario: A failure that never reached the API

- **WHEN** a request fails without reaching the application at all
- **THEN** it is reported in Vietnamese as a connection problem, distinct from a rejection
