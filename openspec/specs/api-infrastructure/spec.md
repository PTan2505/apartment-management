## Purpose

Defines the baseline behavior every API endpoint in this backend relies on: a way to check the service is alive and connected to its database, and a consistent error response shape so clients can handle failures uniformly across all future modules.

## Requirements

### Requirement: Health check endpoint
The system SHALL expose a `GET /health` endpoint that reports whether the API process is running and whether it can reach the configured PostgreSQL database.

#### Scenario: Service and database are healthy
- **WHEN** a client sends `GET /health` and the database connection succeeds
- **THEN** the system responds with HTTP 200 and a JSON body indicating overall status `"ok"` and database status `"ok"`

#### Scenario: Database is unreachable
- **WHEN** a client sends `GET /health` and the database connection fails or times out
- **THEN** the system responds with HTTP 503 and a JSON body indicating overall status `"error"` and database status `"error"`

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

### Requirement: Fail-fast environment configuration
The system SHALL validate required environment variables at process startup and SHALL refuse to start if any required variable is missing or malformed.

#### Scenario: Required environment variable missing
- **WHEN** the process starts and a required environment variable (e.g. `DATABASE_URL`) is not set
- **THEN** the system logs a clear error identifying the missing variable and exits without accepting requests

### Requirement: Standardized paginated response shape
The system SHALL return a consistent paginated shape from every list endpoint, containing a `data` array of items and a `meta` object reporting the current page, the page size, the total number of items matching the request, and the total number of pages. List endpoints SHALL accept optional `page` and `pageSize` parameters, SHALL apply documented defaults when either is absent, and SHALL reject values outside the permitted range rather than silently clamping them.

#### Scenario: Default paging when no parameters are supplied
- **WHEN** a client requests a list endpoint without paging parameters
- **THEN** the system responds with the first page using the default page size, and reports that page number and size in `meta`

#### Scenario: Explicit page and page size
- **WHEN** a client requests a specific page and page size
- **THEN** the response contains at most that many items, drawn from that page of the result set, and `meta` echoes the requested values

#### Scenario: Total reflects the full matching set
- **WHEN** a client requests one page of a result set spanning several pages
- **THEN** `meta` reports the total number of matching items and the total number of pages, not just the count returned on this page

#### Scenario: Page beyond the end of the results
- **WHEN** a client requests a page number past the last page of results
- **THEN** the system responds with HTTP 200, an empty `data` array, and `meta` still reporting the true totals

#### Scenario: Page size above the permitted maximum
- **WHEN** a client requests a page size larger than the maximum the system permits
- **THEN** the system responds with HTTP 400 rather than returning an unbounded response

#### Scenario: Invalid paging values
- **WHEN** a client requests a page or page size that is zero, negative, or not a number
- **THEN** the system responds with HTTP 400 identifying the invalid parameter

#### Scenario: Paging combines with filters
- **WHEN** a client requests a page of a list endpoint while also applying that endpoint's filters
- **THEN** the returned items and the totals in `meta` describe only the filtered set

### Requirement: Monetary values are transported as numbers

Every monetary value in an API response — an amount, a rate, or a measured quantity — SHALL be transported as a JSON number, not as a string. A caller SHALL be able to perform arithmetic, comparison, and ordering on such a value without converting it first.

A monetary value that is absent SHALL be transported as null, and SHALL NOT be reported as zero. The two mean different things: an expense with no recorded rate is not an expense charged at nothing.

This SHALL hold uniformly across every endpoint that returns such a value, including computed figures that are derived rather than stored, so that no caller has to know which fields need special handling.

Values that merely consist of digits — identifiers, phone numbers, room codes — SHALL remain text. Their leading zeros and exact form are significant, and converting them would corrupt them.

#### Scenario: An amount is a number

- **WHEN** a response contains a monetary amount
- **THEN** the value is a JSON number, and ordering a set of such values compares them numerically rather than lexicographically

#### Scenario: A rate is a number

- **WHEN** a response contains a rate, such as a per-unit or per-person charge
- **THEN** the value is a JSON number, including its fractional part where it has one

#### Scenario: A computed total is a number

- **WHEN** a response contains a figure derived from other values rather than stored directly
- **THEN** that figure is a JSON number on the same terms as a stored one

#### Scenario: An absent amount stays absent

- **WHEN** a response contains a monetary field that has no value
- **THEN** the field is null rather than zero or an empty string

#### Scenario: Digit-bearing text is not converted

- **WHEN** a response contains an identifier, phone number, or room code
- **THEN** it is transported as text, retaining any leading zeros and its exact form
