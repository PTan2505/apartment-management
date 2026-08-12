## Why

The backend currently has no database connectivity, no migration tooling, no environment/config validation, no centralized error handling, and no module structure to build domain features into. Every subsequent change (auth, properties, leases, billing, reports) needs a consistent place to plug in a router/controller/service, a working Postgres connection via Prisma, and predictable error responses. Building this scaffolding once, up front, avoids each later change reinventing config loading and error handling ad hoc.

## What Changes

- Restructure `backend/src` into a `modules/<domain>/` convention (router, controller, service, schema per module), with a shared `modules/` root ready for `auth`, `properties`, `rooms`, `leases`, `billing`, and `reports` to be added in later changes.
- Add Prisma as the ORM/migration tool, wired to PostgreSQL, with an initial (empty) schema and migration setup.
- Add environment/config loading and validation (fail fast on missing required env vars: `DATABASE_URL`, `PORT`, etc.).
- Add centralized error-handling middleware producing a consistent JSON error shape across all endpoints.
- Add request logging middleware.
- Add a health-check endpoint (`GET /health`) that reports API liveness and database connectivity.
- No domain models (User, Building, Room, Lease, Invoice) are introduced in this change — those arrive with their respective domain changes.

## Capabilities

### New Capabilities
- `api-infrastructure`: Baseline API behavior every endpoint relies on — health check endpoint, and the standardized JSON error response shape returned by the centralized error handler.

### Modified Capabilities
(none)

## Impact

- **Code**: `backend/src/` restructured into `modules/`, `config/`, `middleware/`, `lib/` (or equivalent) directories; `backend/prisma/schema.prisma` and migration folder added.
- **Dependencies**: adds `@prisma/client`, `prisma` (dev), `zod` (or equivalent) for env validation, plus a logging library (e.g. `pino`).
- **Infrastructure**: requires a running PostgreSQL instance (local dev via `DATABASE_URL`); no AWS S3 or JWT work in this change — those belong to `api-lease-management` and `api-auth-module`.
- **API surface**: adds `GET /health`. No other routes yet.
