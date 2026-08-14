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

#### Scenario: Unhandled error in a route handler
- **WHEN** any route handler throws an unhandled error
- **THEN** the system responds with HTTP 500 and a JSON body matching the standard error shape, and does not leak internal stack traces or implementation details in the response body

#### Scenario: Client sends a malformed or invalid request
- **WHEN** a route handler rejects a request due to validation failure
- **THEN** the system responds with an HTTP 4xx status and a JSON body matching the standard error shape, including details identifying which input failed validation

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
