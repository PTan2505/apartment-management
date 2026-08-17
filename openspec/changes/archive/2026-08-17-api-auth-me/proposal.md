## Why

Login and refresh return only `{ accessToken }`. There is no endpoint that describes the signed-in user, and no `GET /users/:id` either — so a client's only source of identity is the access token's own payload, which carries `sub` and `role` and nothing more.

That is enough to gate a route. It is not enough to show who is signed in: the owner's name and phone number exist in the database and are simply unreachable. The frontend's account menu needs them, and decoding a JWT is not a substitute for asking the server.

## What Changes

- Add `GET /auth/me`, returning the account identified by the caller's access token.
- The response carries the user's id, phone, full name, role, and timestamps. Password material is excluded by explicit field selection, not by deletion after the fact.
- The endpoint requires a valid access token and returns 401 without one. It is **not** restricted to the `owner` role: it describes whoever is calling, and a role restriction would have to be removed the moment tenant login is added.
- This is the first authenticated route in the auth module. The existing three routes stay public, so the middleware is applied to this route rather than to the whole router.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `auth`: adds a requirement covering retrieval of the authenticated caller's own account. The existing login, refresh, and logout requirements are untouched.

## Impact

- **Code**: `backend/src/modules/auth/` — `router.ts`, `controller.ts`, `service.ts`. No other module is affected.
- **Database**: none. No schema change, no migration.
- **API surface**: one new endpoint, `GET /auth/me`.
- **Behavioral change**: none to existing endpoints.
- **Dependencies**: none. This blocks `web-auth`, which consumes it to render the signed-in owner.
- **Out of scope**: no endpoint for updating one's own account, no password change, no listing of users, and no session listing. Tenant (`customer`) login remains a future change; this endpoint is written so it will not need revisiting when that lands.
