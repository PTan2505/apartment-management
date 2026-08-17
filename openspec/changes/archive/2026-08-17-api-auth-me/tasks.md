## 1. Endpoint

- [x] 1.1 Create feature branch `feature/api-auth-me` off `dev`
- [x] 1.2 Add a `meSelect` constant in the auth service listing the returned fields explicitly, mirroring the `customerSelect` pattern in the customers module
- [x] 1.3 Add a `getCurrentUser(userId)` service function selecting the user with `meSelect`
- [x] 1.4 Throw `UnauthorizedError` from the service when no user matches the id, so a token for a deleted account produces 401 rather than a 500
- [x] 1.5 Add a `meHandler` controller reading the caller's id from `req.user` only, never from params, query, or body
- [x] 1.6 Register `GET /me` on the auth router with the `authenticate` middleware applied to that route alone, leaving login, refresh, and logout public

## 2. Verification

- [x] 2.1 Verify a valid access token returns HTTP 200 with id, phone, fullName, role, createdAt, and updatedAt
- [x] 2.2 Verify the response body contains no `passwordHash` and no other password material
- [x] 2.3 Verify a request with no `Authorization` header returns 401
- [x] 2.4 Verify a malformed token returns 401
- [x] 2.5 Verify an expired token returns 401
- [x] 2.6 Verify supplying a different user id as a query parameter or body field still returns the caller's own account
- [x] 2.7 Verify `POST /auth/login`, `POST /auth/refresh`, and `POST /auth/logout` still work without an access token, confirming the middleware was scoped to the new route only
- [x] 2.8 Verify the endpoint is reachable through the frontend dev proxy at `/api/auth/me`

## 3. Wrap-up

- [x] 3.1 Run `tsc --noEmit` and confirm it passes
- [x] 3.2 Confirm all new imports follow the `@/` alias convention and none use `../`
- [x] 3.3 Clean up any verification data, leaving the seeded owner intact
- [x] 3.4 Commit work in atomic commits per completed task group, on `feature/api-auth-me`
