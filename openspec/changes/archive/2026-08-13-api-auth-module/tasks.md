## 1. Branch & dependencies

- [x] 1.1 Create feature branch `feature/api-auth-module` off `dev`
- [x] 1.2 Add dependencies to `backend/package.json`: `bcrypt`, `jsonwebtoken`
- [x] 1.3 Add dev dependencies: `@types/bcrypt`, `@types/jsonwebtoken`
- [x] 1.4 Add `JWT_SECRET` (required, no default) and token-expiry settings to `backend/src/config/env.ts` zod schema, and mirror in `.env.example`

## 2. Prisma models & migration

- [x] 2.1 Add `Role` enum (`owner`, `customer`) to `prisma/schema.prisma`
- [x] 2.2 Add `User` model: `id`, `phone` (unique), `passwordHash` (nullable), `role`, `fullName`, `createdAt`, `updatedAt`
- [x] 2.3 Add `RefreshToken` model: `id`, `userId` (FK to `User`), `tokenHash` (unique), `createdAt`, `expiresAt`, `revokedAt` (nullable)
- [x] 2.4 Run `prisma migrate dev` to generate and apply the migration
- [x] 2.5 Regenerate the Prisma client and confirm the new models are typed and usable

## 3. Auth module scaffolding

- [x] 3.1 Create `backend/src/modules/auth/schema.ts` — zod request schemas for login (phone, password)
- [x] 3.2 Create `backend/src/modules/auth/service.ts` — login, refresh, logout business logic
- [x] 3.3 Create `backend/src/modules/auth/controller.ts` — request/response handling calling into the service
- [x] 3.4 Create `backend/src/modules/auth/router.ts` — routes for `POST /login`, `POST /refresh`, `POST /logout`
- [x] 3.5 Mount the auth router in `backend/src/server.ts` under `/auth`

## 4. Login

- [x] 4.1 Implement phone+password lookup and bcrypt password verification in the auth service
- [x] 4.2 Return the same `UnauthorizedError` for unknown phone, wrong password, and accounts with no `passwordHash` (no enumeration signal)
- [x] 4.3 On success, generate a JWT access token (`{ sub: userId, role }`, 15 min expiry)
- [x] 4.4 On success, generate an opaque refresh token, store its `sha256` hash in a new `RefreshToken` row with a 30-day `expiresAt`
- [x] 4.5 Set the refresh token as an `httpOnly; Secure; SameSite=Strict; Path=/auth` cookie; return the access token in the JSON response body

## 5. Refresh & logout

- [x] 5.1 Implement `POST /auth/refresh`: hash the incoming cookie value, look up the `RefreshToken` row, reject (401) if not found, revoked, or expired
- [x] 5.2 On a valid refresh token, issue a new access token only — do not create, rotate, or replace the refresh token or its DB row
- [x] 5.3 Implement `POST /auth/logout`: hash the incoming cookie value, set `revokedAt` on the matching `RefreshToken` row, clear the cookie
- [x] 5.4 Confirm logout only revokes the single matching row, leaving other refresh tokens for the same user (other devices/logins) untouched

## 6. Authentication middleware

- [x] 6.1 Create `backend/src/middleware/authenticate.ts`: parse `Authorization: Bearer <token>`, verify via `jsonwebtoken`, throw `UnauthorizedError` on missing/malformed/expired/invalid tokens
- [x] 6.2 On success, attach `req.user = { userId, role }`
- [x] 6.3 Extend `backend/src/types/express.d.ts` to type `req.user`
- [x] 6.4 Add a temporary protected test route (or apply the middleware to a no-op route) to verify the middleware end-to-end; remove any throwaway route before final commit

## 7. Owner seed script

- [x] 7.1 Create `backend/scripts/seed-owner.ts` reading phone/password/fullName from env vars or CLI args
- [x] 7.2 Hash the password with bcrypt and upsert a `User` row with `role: owner`, keyed on phone number (idempotent re-run)
- [x] 7.3 Add an `npm run seed:owner` script entry in `backend/package.json`
- [x] 7.4 Document the seed command in `backend/README.md`

## 8. Verification

- [x] 8.1 Run the seed script and confirm an owner row is created in the database
- [x] 8.2 Manually verify `POST /auth/login` with correct owner credentials returns 200, an access token, and sets the refresh cookie
- [x] 8.3 Manually verify login with wrong password and with an unknown phone number both return the same 401 shape
- [x] 8.4 Manually verify a protected route rejects requests with no/expired/malformed access token (401) and accepts a valid one
- [x] 8.5 Manually verify `POST /auth/refresh` issues a new access token for a valid refresh cookie, and that the refresh cookie itself is unchanged
- [x] 8.6 Manually verify `POST /auth/refresh` returns 401 for an expired, revoked, or unrecognized refresh token
- [x] 8.7 Manually verify `POST /auth/logout` revokes the session (subsequent refresh with the same cookie returns 401)
- [x] 8.8 Run `tsc --noEmit` and confirm it passes
- [x] 8.9 Commit work in atomic commits per completed task group, on `feature/api-auth-module`
