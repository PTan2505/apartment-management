## ADDED Requirements

### Requirement: An error code names the situation, not its category

Every error the system returns SHALL carry a code identifying WHICH failure occurred, distinct from the code carried by any other failure that would be phrased differently to a reader.

A code shared by unrelated failures is not a machine-readable code, it is a restatement of the HTTP status. If two failures would be explained to a person in different words, they SHALL NOT share a code.

The category of a failure — rejected input, missing resource, conflict, not permitted, not authenticated — SHALL remain readable from the HTTP status, so that making the code specific does not cost a caller the ability to handle a whole class of failures at once.

Codes SHALL be stable. A code is what another system stores, branches on and translates; renaming one is a breaking change to every caller, so a code SHALL NOT be changed to improve its wording.

The message SHALL remain present and SHALL remain a human-readable explanation. A caller with no phrase for a code needs something to fall back to, and a log with only codes in it cannot be read by the person paged at three in the morning.

#### Scenario: Two unrelated validation failures

- **WHEN** a caller is rejected for adding a room to a retired building, and separately for setting a fee to start before its lease does
- **THEN** the two responses carry different codes

#### Scenario: The category is still available

- **WHEN** a caller wants to handle every missing-resource failure the same way
- **THEN** the HTTP status distinguishes those from rejected input, conflicts, and authorization failures, without the caller needing to enumerate codes

#### Scenario: A failure before any route runs

- **WHEN** a request is rejected for a body that could not be parsed, or is addressed to no route at all
- **THEN** it carries a specific code in the same way as a failure raised inside a handler

#### Scenario: The message survives

- **WHEN** any request fails
- **THEN** the response carries both the code and a human-readable message explaining the failure
