## Context

See proposal.md — Why. What shapes the approach, read from the code:

- `RefreshToken` already solves nearly this problem: `randomBytes(32).toString("hex")`, stored as `createHash("sha256")`, with a `revokedAt` column. Long-lived, revocable, hashed.
- The access token is a JWT signed with `JWT_SECRET`, 15 minutes, stateless — and therefore not revocable.
- Every router in `server.ts` calls `authenticate` and `requireRole("owner")` in its own `use()`. There is no public route to follow as a precedent, and no place where one would accidentally inherit a guard.
- `requestLogger` is `pinoHttp` with defaults, which logs `req.url` on every request. Confirmed in the server log during this project's own verification runs.
- `LeaseOccupant` records `joinedAt` and `leftAt`, so "was occupying when this was issued" is answerable without inventing anything.
- No rate-limiting library is installed. Adding one would be the first new dependency since the project began.

## Goals / Non-Goals

**Goals:**

- Let a tenant read their own bills, itemised, without an account.
- Give the owner a link they can withdraw.
- Land the public surface on its own, verified by what it refuses.

**Non-Goals:**

- Paying. The gateway is the next change.
- Any tenant-initiated write. Reading only, in every sense.
- Rate limiting, throttling or lockout.
- A tenant seeing anything about the building, the owner, or other tenancies.

## Decisions

### An opaque hashed token, not a JWT

The obvious move is to reuse the access token's machinery, and it does not survive the requirement it has to meet.

A JWT is a signed claim; nothing consults storage to accept it, which is what makes it fast and what makes it impossible to withdraw. A portal link has to live for the length of a tenancy — months, often years — and has to be killable the moment a tenant forwards it to somebody. Those two together rule the JWT out: a two-year token nobody can revoke is a two-year exposure the moment it leaks.

The hybrid — sign a JWT, then check a revocation list on every request — was considered and rejected. Once a request touches the database anyway, the JWT's only advantage is gone and what remains is two mechanisms where one would do.

So: `randomBytes(32)`, hashed with SHA-256, one row per customer. This is the refresh token's design, applied to the same shape of problem, using the same helpers.

SHA-256 rather than bcrypt, also as the refresh token does: the value is 256 bits of uniform randomness, so there is no dictionary to slow down, and the hash has to be looked up by equality rather than compared one row at a time.

### The token travels in a header, and the link carries it in the URL fragment

`pinoHttp` logs `req.url`. A token in the path or the query string is therefore written into the log on every single request — a file that is rotated, shipped to wherever logs go, and read by anyone debugging. The token is hashed in the database precisely so that a copy of the database is not a copy of everyone's link; leaving it in the logs undoes that.

The API therefore takes the token in an `Authorization` header. The link the owner sends carries it after a `#`:

```
https://…/portal#t=<token>
```

A URL fragment is never transmitted to the server at all. The page reads it, sends it as a header, and the token never reaches a log line. For the tenant this is identical to any other link — they open it, and it works.

Redacting the log was considered as an alternative and, during implementation, turned out to be **necessary as well** rather than instead. `pino-http` logs request *headers* by default, not only the URL — so moving the token into `Authorization` moved it from one logged field to another. The verification for this change asserted the token was nowhere in the log, and found it there.

What it also found: the owner's access token and the refresh token cookie have been written to the log on every request **since the project began**. That is fixed here, by redacting `req.headers.authorization`, `req.headers.cookie` and `res.headers["set-cookie"]`.

The two measures are not redundant. Redaction covers this server's log and nothing else; the fragment keeps the token out of browser history, out of any proxy in between, and out of a log belonging to something this project does not control. Each closes a path the other leaves open.

### A missing token is 401; a wrong one is 404

No token at all is a request that has not tried to identify itself: 401.

A token that is unknown, revoked, or not a token at all is 404, identically. The distinction an attacker wants is exactly the one between "never existed" and "existed and was withdrawn" — the second confirms a guess. There is no rate limit to blunt that, so the responses have to be indistinguishable.

### Scope is computed from occupancy, not from the lease

What a token can see is derived from `LeaseOccupant`: the tenancies the holder occupies now, and — for unpaid invoices only — the tenancies they occupied before.

The simpler rule, "every lease you ever occupied", leaks: the room is re-let, new bills are issued, and the previous tenant keeps watching them. The stricter rule, "only current tenancies", hides the final invoice, which is issued at the moment the move-out is recorded and is therefore always addressed to somebody who has just stopped being a current occupant.

Restricting past tenancies to what is unpaid resolves both. What you still owe stays visible; what the next tenant owes never becomes visible.

### The portal has its own response shape

The invoice shape the owner receives is not reused.

Reusing it means every field added for the owner appears in the tenant's response the day it is added, decided by nobody. The fields at risk are not hypothetical — this project has added a deposit holding, a settlement figure, a payment method and a set of internal ids to invoices and leases over the last few changes.

The cost is a second mapper to maintain. That cost is the mechanism: adding a field to the tenant's view is a decision someone has to make on purpose.

### No rate limiting, and what that rests on

Nothing throttles the portal. With 256 bits of entropy, guessing is not a threat model — it is arithmetic that does not finish.

What this does mean: a token that has genuinely leaked can be used freely until the owner revokes it, and there is no signal that draws attention to it. The mitigation is `lastUsedAt`, which at least lets an owner notice a link being used when the tenant says they have not opened it.

The trade is recorded here so the signal to revisit it is explicit: repeated 404s from one source in the logs means someone is probing, and that is when a limiter earns its dependency.

## Risks / Trade-offs

- **This is the first door in the wall.** Every endpoint until now has been behind an owner's token. → The verification is written around what must *not* be reachable: an unknown token, a revoked token, another tenant's invoices, a former tenant's replacement bills. Checked as refusals, not as successes.

- **The public router must not accidentally inherit — or accidentally shed — the wrong guard.** Mounting it beside the others is a one-line mistake in either direction. → Checked directly: the portal answers without an owner token, and every other route still refuses without one.

- **An owner-only field leaking into the tenant's response.** → The separate mapper makes it impossible by construction rather than by review, and the verification asserts the tenant's response contains only the fields named in the spec.

- **A leaked link is silently exploitable.** No throttle, no alert. → Accepted, with `lastUsedAt` as the only signal and the revocation path as the remedy. Named rather than discovered.

- **The token is shown exactly once.** An owner who loses it before sending it has to regenerate, which invalidates a link that may already be in use. → Deliberate: the alternative is storing it in the clear, which is the thing being avoided. Regeneration is one action.

## Migration Plan

1. Add the token table. Nothing existing reads it and no existing behaviour depends on it.
2. Mount the portal router outside the authentication middleware; every other mount is untouched.
3. Rollback is dropping the table and removing the mount. No data written by this change is read by anything else.
