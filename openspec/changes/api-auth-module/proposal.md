## Why

Every domain module still to come (properties, rooms, leases, billing, reports) needs to know who is calling and whether they're allowed to. There is currently no way to authenticate a request at all — no User model, no login, no token issuance, no way to protect a route. This change establishes identity and access control once, so every later module can require authentication with a single shared middleware instead of reinventing it.

## What Changes

- Add the first two Prisma models: `User` (id, phone, passwordHash, role, fullName, timestamps) and `RefreshToken` (id, userId, tokenHash, createdAt, expiresAt, revokedAt), with a real migration.
- Add a `role` enum on `User` with two values: `owner` (the only login-capable role in v1 — full permissions across the system) and `customer` (tenant/lessee data record, no password or login in v1; created by a later lease-management change).
- Add `POST /auth/login` — phone + password, verified against a bcrypt hash, issuing a short-lived JWT access token and a long-lived opaque refresh token.
- Add `POST /auth/refresh` — validates the refresh token against its DB-backed record and issues a new access token. The refresh token itself is not rotated/replaced.
- Add `POST /auth/logout` — revokes the specific refresh token record used, ending that one session/device without affecting others.
- Add authentication middleware that verifies the access token and attaches the caller's identity to the request, for later modules to depend on.
- Add a one-off seed script to create the first `owner` account. There is no public/self-service registration endpoint in v1.
- No authorization/permission-scoping logic for specific resources yet (e.g. "owner can only see their own buildings") — v1 has exactly one owner role with unrestricted access, so per-resource authorization is out of scope until there's more than one owner account or role to distinguish between.

## Capabilities

### New Capabilities
- `auth`: Login, token issuance/refresh/revocation, and request authentication for the API.

### Modified Capabilities
(none)

## Impact

- **Code**: new `backend/src/modules/auth/` (router, controller, service, schema), new `backend/src/middleware/authenticate.ts` (or similar), new `backend/prisma/schema.prisma` models + migration, new seed script.
- **Dependencies**: adds `bcrypt`, `jsonwebtoken` (or equivalent), a secure random token generator (Node's built-in `crypto` is sufficient).
- **Database**: first real migration against PostgreSQL (previous change shipped an empty schema).
- **API surface**: adds `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`. Adds a reusable auth middleware that later changes (properties, rooms, leases, billing, reports) will apply to their routes.
- **Out of scope**: no S3 integration, no lease/tenant onboarding, no per-resource authorization beyond "is this an authenticated owner" — those belong to later changes per the roadmap.
