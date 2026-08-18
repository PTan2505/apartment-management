## Context

`web-foundation` left three things this change builds on: an axios instance with a response interceptor that normalizes every failure into `ApiError`, React Query with retry defaults that never repeat a 4xx, and an `AppShell` rendered at `/` with every destination nested beneath it.

The backend side is fixed and not negotiable here: an access token in the login response body (15 minutes, stateless), a refresh token as an `httpOnly` cookie the dev proxy rewrites to `Path=/api/auth`, refresh tokens that **do not rotate**, and `GET /auth/me` returning the caller's account. Login returns only `{ accessToken }` — no user object.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One mechanism for "is there a session", used identically at boot, after login, and after renewal — rather than three code paths that can disagree.
- Make renewal invisible: a user working through a 15-minute boundary should notice nothing.
- Leave the domain changes with nothing to think about. A screen calls `apiClient`, and authentication has already happened.

**Non-Goals:**
- No abstraction over authentication for future providers. There is one login method and no plan for another.
- No client-side authorization logic. `owner` is the only role that can sign in; the server decides everything else.
- No refresh-token handling in the frontend at all. It is an `httpOnly` cookie — the browser sends it, and JavaScript never sees it.

## Decisions

### `GET /auth/me` is the session check, not the token's `exp`

The obvious design reads the stored token, decodes its `exp`, and decides locally whether it is still good. This change asks the server instead.

```
  boot
   │  stored token → api client
   ▼
  GET /auth/me
   │
   ├─ 200 ─────────────► signed in, and the account is in hand
   │
   ├─ 401 ─► interceptor: POST /auth/refresh
   │           ├─ 200 → retry /auth/me → signed in
   │           └─ 401 → signed out
   │
   └─ no response ─────► connection problem, NOT signed out
```

Why this is better than decoding:

| | decode `exp` locally | ask `/auth/me` |
|---|---|---|
| expired token | detected | detected |
| **revoked** token | **missed** — still "valid" locally | detected |
| tampered token | missed | detected |
| clock skew / sleep | a live problem | irrelevant |
| user record | needs a second request | comes back in the same response |
| dependency | a JWT decoder | none |

The revoked case is the one that matters: a token can be signed, unexpired, and still worthless. Only the server knows. And because the check has to happen anyway to populate the account menu, asking costs nothing extra.

The consequence worth stating plainly: **no JWT is ever decoded client-side**. There is no decoder dependency and no place where the client interprets a credential it cannot verify.

### Auth state is a React Query query, not a hand-written state machine

`/auth/me` is fetched as an ordinary query, and the four states fall out of its result:

```
  useQuery({ queryKey: ['auth','me'], retry: false })

    isPending                  → UNKNOWN    splash; neither login nor content
    data                       → SIGNED IN  render the app
    error.isUnauthorized       → SIGNED OUT redirect to /login
    error.isTransport          → OFFLINE    "cannot reach the server"
```

`retry: false` is set explicitly rather than relying on the shared default. The default already refuses to retry a 4xx, but boot is the one place where an accidental retry would visibly stall the splash screen, so it is pinned locally where it can be read.

Alternatives considered. *A hand-written reducer with the same four states*: more code, and it would duplicate caching and invalidation that React Query already does. *A router loader*: ties session resolution to navigation, which makes "refetch the account after a change" awkward. Using a query means `queryClient.invalidateQueries(['auth','me'])` is all a future account-edit screen needs.

The fourth state is the one usually missing. Treating a transport failure as "signed out" means that whenever the backend is down, every user is told their session ended — which is false, and sends them to re-enter credentials that cannot possibly be checked. `ApiError.kind` exists precisely to tell these apart.

### The token store is a module, not React state

The request interceptor needs the token synchronously while building a header, and it is not a component — it cannot call a hook. So the token lives in a module with `localStorage` behind it.

```
   axios request interceptor          React components
   ─────────────────────────          ────────────────
   getAccessToken()                   useQuery(['auth','me'])
   sync, no hooks                     the session, not the token
          │                                   │
          ▼                                   ▼
   one module variable,               the server's answer about
   mirrored to localStorage           who the caller is
```

Nothing renders from the token store, so it needs no subscription mechanism. Whether the user is signed in is answered by the auth query, not by whether a token happens to be present — a token can exist and be worthless. Keeping the two separate avoids a second source of truth that could disagree with the first.

### `localStorage`, and what it costs

Recorded explicitly so it reads as a decision rather than an accident.

An injected script can read `localStorage` and send the access token elsewhere, where it stays usable for up to fifteen minutes. In-memory storage would prevent that particular exfiltration, though a script on the page could still call the API directly for as long as the page is open. What is bought:

- The session survives a reload without waiting on a renewal round-trip.

That is now the only thing it buys — see the next decision, which gives up the other one.

The refresh token is unaffected: it stays in an `httpOnly` cookie and is not reachable from JavaScript under any of these options. The 30-day credential is never exposed; only the 15-minute one is.

### Tabs are not kept in step

Each tab keeps its own copy of the token in memory. Signing out in one tab removes the stored token, but another open tab carries on with the copy it already has until it reloads, or until that copy expires and renewal fails against the revoked cookie.

A `storage` event listener would close that window — the event fires in *other* tabs when a key changes, which is exactly the needed semantics — and it was deliberately dropped to keep the auth surface small. The exposure it would close is bounded by the access token's own lifetime, on a tool with one operator.

Note this removes one of the two arguments for `localStorage` over in-memory storage: shared storage is what makes cross-tab observation possible at all. The remaining argument, surviving a reload without a renewal round-trip, still stands on its own.

### Reactive renewal, retried exactly once

The response interceptor already normalizes errors; renewal hooks into the same place. Two guards keep it bounded:

```
  request ──401──► already retried?  ── yes ──► fail
                          │ no
                          ▼
                   is this /auth/refresh? ── yes ──► fail    (or it renews itself)
                          │ no
                          ▼
                   POST /auth/refresh ──► retry original, marked as retried
```

Omitting either guard produces an infinite request loop that presents as a hung page and a scrolling network tab.

**No single-flight de-duplication.** Five requests rejected simultaneously produce five renewal calls, all of which succeed and return five equally valid tokens; the last write wins and nothing is inconsistent. This is only safe because refresh tokens do not rotate — with rotation, four of those five would be replaying a superseded token, which is indistinguishable from theft. The non-rotating decision made earlier is what makes the simple version correct, so the trade is recorded here rather than left as an apparent omission.

### The router splits, with the gate above the shell

```
  before                        after
  ──────                        ─────
  /                             /login  ──► LoginPage          (no shell)
  └── AppShell                  /       ──► ProtectedRoute
        ├── /buildings                            └── AppShell
        ├── /rooms                                      ├── /buildings
        └── *  NotFound                                 └── *  NotFound
```

`ProtectedRoute` sits *above* `AppShell`, not inside it. Placed inside, the shell mounts and its navigation paints before the redirect runs — a visible flash of an interface the visitor cannot use. The remembered destination travels in router state rather than a query parameter, so it does not survive being bookmarked or shared.

`/login` carries the inverse guard: a signed-in user opening it is sent into the application.

### Form validation mirrors the API and goes no further

The backend's login schema is `min(1)` on both fields — nothing more. The client-side schema matches it exactly.

This is worth stating because the instinct is to add a phone-format rule. Any such rule the API does not share becomes a credential the UI rejects and the API would have accepted, and the failure is invisible from the backend. The API owns credential correctness; the form only avoids a pointless round-trip on an empty field.

`react-hook-form` with a zod resolver is introduced here rather than in a domain change so the pattern is established once. It is overkill for two fields on its own, but the same setup carries the eight domain forms that follow.

## Risks / Trade-offs

- [An XSS payload can read the access token from `localStorage` and use it off-page for up to 15 minutes] → accepted deliberately; documented above with what it buys. The refresh token stays `httpOnly`, so the 30-day credential is never exposed. Revisit if the application ever renders user-supplied HTML.
- [Removing either interceptor guard yields an infinite renewal loop] → both are covered by their own scenarios and their own verification tasks, rather than being assumed.
- [Five simultaneous renewals is wasteful, and would be a correctness bug under token rotation] → harmless today and explained above; the note is here so that anyone adding rotation later sees that single-flight becomes mandatory at the same moment.
- [A tab left open after signing out elsewhere keeps working until it reloads or its token expires] → accepted deliberately in exchange for a smaller auth surface; bounded by the access token's short lifetime, and the refresh cookie is already revoked so the tab cannot renew.
- [The remembered destination lives in router state, so a full reload on the login screen loses it and the user lands on the default] → an acceptable edge; putting it in the URL would leak the intended destination into bookmarks and history for a page the visitor could not open.
- [Boot now depends on one API call, so a slow backend means a longer splash] → the alternative is trusting a credential the client cannot verify; a spinner is the honest representation of not yet knowing.
- [`web-foundation`'s addressability requirement is modified rather than left alone] → deliberate. Leaving it would assert that entering an address opens its destination, which authentication makes untrue; the archived spec would have quietly outranked the new one.

## Migration Plan

Nothing is deployed and no session data exists, so there is no rollout or migration concern. Within the change, the order that keeps each step independently testable: token store, then the API functions, then the interceptors, then the auth query and provider, then the login screen, then the route restructure, then the account menu.

Rollback is discarding the branch. No backend, database, or published artifact is touched.
