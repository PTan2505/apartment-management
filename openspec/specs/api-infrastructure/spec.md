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
