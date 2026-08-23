## MODIFIED Requirements

### Requirement: Standardized error response shape

The system SHALL return a consistent JSON error shape for every failed request, regardless of which module or route produced the error, containing at minimum an HTTP-appropriate status code, a machine-readable error code or type, and a human-readable message.

**This holds for failures that occur before any route handler runs.** A request rejected while its body is being read, or addressed to nothing at all, is still a failed request and SHALL be answered in the same shape as any other. These are the failures most easily left out, because no code of the system's own is running when they happen — and a caller cannot parse an error body that arrives as HTML, nor act on a status that blames the wrong party.

A failure caused by what the caller sent SHALL be reported with a 4xx status. A body that cannot be parsed, one larger than the system accepts, one in an encoding it does not read, and one that never finished arriving are all of this kind. Reporting them as 5xx tells the caller the system is at fault and invites a retry that will fail identically every time.

A request whose body could not be parsed SHALL be distinguishable from one whose contents failed validation. Validation failures name the inputs that failed; a body that was never parsed has no inputs to name, and a caller that cannot tell the two apart cannot tell whether to fix its encoding or its values.

Every failed request SHALL be logged, including one that failed before reaching a route. A failure that is answered but not recorded cannot be noticed, and an unnoticed failure is indistinguishable from one that never happened.

The system SHALL NOT leak internal stack traces or implementation details in any error response body.

#### Scenario: Unhandled error in a route handler

- **WHEN** any route handler throws an unhandled error
- **THEN** the system responds with HTTP 500 and a JSON body matching the standard error shape, and does not leak internal stack traces or implementation details in the response body

#### Scenario: Client sends a malformed or invalid request

- **WHEN** a route handler rejects a request due to validation failure
- **THEN** the system responds with an HTTP 4xx status and a JSON body matching the standard error shape, including details identifying which input failed validation

#### Scenario: A request body that cannot be parsed

- **WHEN** a client sends a request whose body is not valid JSON
- **THEN** the system responds with HTTP 400 and a JSON body matching the standard error shape, carrying a code that means the body could not be read

#### Scenario: A body that could not be parsed is not reported as a validation failure

- **WHEN** a client sends a request whose body is not valid JSON
- **THEN** the code returned differs from the one used for a request whose body was read and whose values failed validation

#### Scenario: A request body larger than the system accepts

- **WHEN** a client sends a request body exceeding the accepted size
- **THEN** the system responds with HTTP 413 and a JSON body matching the standard error shape

#### Scenario: A request body in an encoding the system does not read

- **WHEN** a client sends a request body in an unsupported encoding
- **THEN** the system responds with HTTP 415 and a JSON body matching the standard error shape

#### Scenario: A request body that never finished arriving

- **WHEN** a client stops sending before the request body is complete
- **THEN** the system responds with a 4xx status and does not record the failure against itself as a server fault

#### Scenario: An address matching no route

- **WHEN** a client requests an address that matches no route
- **THEN** the system responds with HTTP 404 and a JSON body matching the standard error shape, not an HTML page

#### Scenario: A failure before routing is logged

- **WHEN** a request fails before any route handler runs
- **THEN** the failure appears in the system's request log, as a request that failed with the status it was answered with

#### Scenario: A request that succeeds is unaffected

- **WHEN** a client sends a well-formed request to an address that exists
- **THEN** it is handled as before, and no error shape is produced
