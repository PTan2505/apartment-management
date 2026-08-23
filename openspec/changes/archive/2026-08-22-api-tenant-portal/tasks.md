# Tasks

## 1. Structure

- [x] 1.1 Add a portal access token table: the customer it belongs to, the hashed token, when it was revoked, and when it was last used. Same shape as the refresh token, for the same reasons.
- [x] 1.2 Index the hash uniquely — it is looked up by equality on every portal request.
- [x] 1.3 Migrate. The table is additive and nothing existing reads it.
- [x] 1.4 Run `prisma generate`.

## 2. Issuing and withdrawing a link

- [x] 2.1 Generate a token from 32 bytes of cryptographically secure randomness, store only its SHA-256 hash, and return the token itself once.
- [x] 2.2 Reuse the refresh token's generation and hashing rather than writing a second version of either.
- [x] 2.3 Revoke any previous token when a new one is generated, so replacing a link is one action.
- [x] 2.4 Add revoking a token outright, and refuse it where the customer has none.
- [x] 2.5 Refuse issuing a token for a user whose role is not `customer`.
- [x] 2.6 Report on a customer that a link exists and when it was issued and last used — never the token.
- [x] 2.7 Require an authenticated owner on both.

## 3. The public surface

- [x] 3.1 Mount a portal router **outside** the authentication middleware, and leave every other mount exactly as it is.
- [x] 3.2 Accept the token in an `Authorization` header, never in the path or the query string. `pinoHttp` logs `req.url` on every request, and a token there is a token in the log file.
- [x] 3.3 Answer an unknown, revoked or malformed token identically with 404, and a request carrying no token at all with 401.
- [x] 3.4 Record when a token was last used.
- [x] 3.5 Run `tsc --noEmit`.

## 4. What a tenant sees

- [x] 4.1 Resolve the tenancies a token can see from occupancy: those the holder occupies now, and those they have left.
- [x] 4.2 Show every invoice of a current tenancy, and only the unpaid invoices of a former one.
- [x] 4.3 Exclude voided invoices.
- [x] 4.4 Build the response from a mapper written for the tenant, not from the one written for the owner. A field added for the owner must not appear here by default.
- [x] 4.5 Itemise each bill: description, quantity and rate where there were any, the period, and the amount — plus the total, the kind, the issue date and whether it is paid.
- [x] 4.6 Return a tenant with no tenancy as an empty list of bills rather than an error.

## 5. Verification against the running API

This change opens a public surface, so most of what matters is what it refuses. Failure paths are the point, not an afterthought.

- [x] 5.1 Generating a link returns a token, and that token opens the portal.
- [x] 5.2 The token appears in the generate response and in **no** other response — checked by retrieving the customer afterwards.
- [x] 5.3 The stored value is a hash, not the token — checked in the database directly.
- [x] 5.4 **Regenerating kills the previous link**: the old token returns 404, the new one works.
- [x] 5.5 **Revoking kills the link**: the token returns 404.
- [x] 5.6 Revoking when there is no link returns 404.
- [x] 5.7 Issuing a link for an owner account returns 400 and creates nothing.
- [x] 5.8 **An unknown token, a revoked token and a malformed one return the same status and the same body** — compared byte for byte, since a difference between them confirms a guess.
- [x] 5.9 A request with no token at all returns 401.
- [x] 5.10 `lastUsedAt` is recorded, and visible to the owner.
- [x] 5.11 **A tenant sees every invoice of their current tenancy**, paid and unpaid.
- [x] 5.12 **A tenant who has moved out still sees their unpaid final bill.** The case the strict rule would have hidden.
- [x] 5.13 **A tenant does not see an invoice issued for their old room after they left.** The case the loose rule would have leaked.
- [x] 5.14 **A tenant sees no invoice of a tenancy they never occupied** — checked against a second tenant in the same building.
- [x] 5.15 A non-signatory occupant sees their tenancy's invoices.
- [x] 5.16 A voided invoice is absent.
- [x] 5.17 A customer with no tenancy gets their details and an empty list, not an error.
- [x] 5.18 A bill is itemised: rent, electricity, water and service fees each with their own amount and period.
- [x] 5.19 An electricity charge reports the consumption and rate it was computed from.
- [x] 5.20 **The tenant's response carries only the fields the spec names** — no lease id, no building, no deposit holding, no internal ids beyond what is needed to identify a bill.
- [x] 5.21 **Every other endpoint still refuses an unauthenticated request.** Mounting a public router must not have loosened anything else.
- [x] 5.22 **A portal token is not accepted as an owner's access token**, and an owner's access token is not accepted as a portal token.
- [x] 5.23 The token is nowhere in the server's request log after a full portal session. **Failed on the first run and found a real leak.** Moving the token out of the URL was not enough: `pino-http` logs request *headers* by default, so it landed in `req.headers.authorization` instead. Worse, the same default had been writing the owner's access token and the refresh token cookie to the log **since the project began** — 62 log lines carried one or the other. Fixed by redacting `req.headers.authorization`, `req.headers.cookie` and `res.headers["set-cookie"]`; re-run confirms neither the portal token nor the owner's token appears. Recorded in design.md: the fragment and the redaction close different paths and both are needed.
- [x] 5.24 Remove the verification data, leaving the database as it was found.
