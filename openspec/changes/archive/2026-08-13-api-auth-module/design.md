## Context

`api-core-setup` established the `modules/<domain>/{router,controller,service,schema}.ts` convention, a Prisma client wired to PostgreSQL via `@prisma/adapter-pg`, typed `AppError` subclasses, and centralized error handling — but shipped with an empty Prisma schema and no auth of any kind. See proposal.md for why this change exists now.

Decisions locked before this design was written (from prior exploration, not open for reconsideration here): `owner` is the only login role in v1 (`customer` is data-only); no public registration — first owner created via seed script; bcrypt for password hashing; non-rotating refresh tokens; refresh token as an httpOnly/Secure/SameSite=Strict cookie scoped to `Path=/auth`, backed by a hashed DB row; one refresh token row per login/device.

## Goals / Non-Goals

**Goals:**
- Define the `User` and `RefreshToken` Prisma models and ship the first real migration.
- Implement login, refresh, and logout exactly per the `auth` capability spec.
- Provide a single reusable `authenticate` middleware that every later domain module attaches to its protected routes.
- Provide a seed mechanism for the first owner account that doesn't require an HTTP surface.

**Non-Goals:**
- No fine-grained authorization/permissions (e.g. resource-level ownership checks) — v1 has one unrestricted `owner` role, so "authenticated as owner" is the only check needed anywhere in this change.
- No customer/tenant login — the `customer` role exists in the schema for `api-lease-management` to use later, but gets no auth flow here.
- No password reset / forgot-password flow — not mentioned in the system description; can be added later if needed.
- No refresh token rotation — explicitly deferred per the locked decision above.

## Decisions

**Token generation**: access tokens are JWTs signed with a server-side secret (`JWT_SECRET`, added to the env schema from `api-core-setup`'s `config/env.ts`), payload `{ sub: userId, role }`, 15 minute expiry, verified with the `jsonwebtoken` library. Refresh tokens are NOT JWTs — they're `crypto.randomBytes(32).toString("hex")`, opaque to the client, unparseable, existing purely as a lookup key against the `RefreshToken` table. Alternative considered: making the refresh token a JWT too, for consistency — rejected because a refresh token has no legitimate reason to be client-readable, and an opaque token avoids any risk of accidentally leaking claims in a token that lives for 30 days.

**RefreshToken storage**: only a hash of the refresh token (`sha256`, not bcrypt — this is a high-entropy random token, not a low-entropy user password, so a fast hash is appropriate and avoids unnecessary bcrypt cost on every refresh request) is stored in the `tokenHash` column. On `/auth/refresh` and `/auth/logout`, the incoming cookie value is hashed and looked up by exact match. Columns: `id`, `userId` (FK to User), `tokenHash` (unique), `createdAt`, `expiresAt`, `revokedAt` (nullable). No rotation means `revokedAt` is the only mutation path after creation, other than natural expiry.

**Cookie delivery**: refresh token set via `Set-Cookie` with `httpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=<30 days in seconds>`. `Path=/auth` means the browser only attaches this cookie to `/auth/*` requests, not to every API call — reduces the request surface where the cookie could be intercepted or misused, and means non-auth routes never even see it.

**Access token delivery & the auth middleware**: access token returned in the JSON response body from `/auth/login` and `/auth/refresh` (not a cookie — this is a short-lived bearer token, and client-side storage strategy is explicitly a frontend concern per the proposal). `authenticate` middleware in `backend/src/middleware/authenticate.ts` reads `Authorization: Bearer <token>`, verifies it with `jsonwebtoken`, and on success attaches `req.user = { userId, role }` (typed via the existing `src/types/express.d.ts` augmentation pattern already used for `req.log`). On failure (missing header, malformed token, expired, invalid signature) it throws `UnauthorizedError` from `lib/errors.ts`, which the existing centralized error handler already converts to the correct response shape — no new error-shaping logic needed here.

**Owner seed script**: a standalone script (`backend/scripts/seed-owner.ts`, run via `npm run seed:owner`) that reads phone/password/fullName from environment variables or CLI args, hashes the password with bcrypt, and upserts a `User` row with `role: owner`. Alternative considered: a Prisma `seed` hook wired into `prisma db seed` — rejected as the primary interface because it implies "run this every fresh environment," whereas creating an owner is a one-time, deliberate, credential-bearing action better kept as an explicit standalone command a human runs once.

**Login response on ambiguous failure**: per the spec, wrong-password and unknown-phone both return the same 401 with the same body, to avoid account enumeration. The service layer implements this as a single `UnauthorizedError("Invalid phone number or password")` thrown from both branches, rather than two distinguishable error paths that happen to render the same — this guarantees they can't drift apart later (e.g. someone adding a detail to one branch and not the other).

## Risks / Trade-offs

- [Non-rotating refresh tokens mean a stolen token is valid for its full 30-day life with no in-band theft detection] → accepted tradeoff per prior discussion, appropriate for single-operator v1 scope; documented here so it's visible to whoever revisits this later, not silently inherited.
- [`JWT_SECRET` must be a strong, non-default value in any real deployment] → add it to the required (non-defaulted) fields in `config/env.ts`'s zod schema, so a missing/weak secret fails fast at startup rather than silently signing tokens with an empty or placeholder string.
- [Seed script re-run could create duplicate owners or fail confusingly] → make it an upsert keyed on phone number, so re-running is idempotent rather than erroring or duplicating.
- [Clock skew or long-lived processes holding a stale `JWT_SECRET` across a rotation] → out of scope for v1 (single deployment, no secret rotation infrastructure yet); noted for whenever real deployment/ops work happens.

## Migration Plan

This adds the first real Prisma migration (previous change shipped an empty schema). Deploy steps: run `npx prisma migrate dev` (or `migrate deploy` in a non-dev environment) to create `User` and `RefreshToken` tables, then run `npm run seed:owner` once to create the initial owner account before the API is usable for any authenticated action. No existing data to migrate. Rollback: revert the migration (`prisma migrate reset` in dev, or a down-migration in a real environment) — acceptable since no production data exists yet at this stage of the project.
