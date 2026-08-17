## Context

`frontend/` is an untouched Vite scaffold: React 19, plain JavaScript, one `App.jsx`, no router, no HTTP client, no UI library. `backend/` is complete — 41 endpoints under eight path prefixes (`/auth`, `/buildings`, `/rooms`, `/customers`, `/leases`, `/invoices`, `/expenses`, `/reports`) plus `/health`, all mounted at the root.

Three properties of the finished backend shape this design, and are the reason it needs one:

- The refresh token is an `httpOnly` cookie scoped to `Path=/auth`. Anything that changes the path an auth request is made on changes whether that cookie is sent.
- `app.use(cors())` sends `Access-Control-Allow-Origin: *` with no `Access-Control-Allow-Credentials`, so credentialed cross-origin requests are unusable as-is.
- Services return Prisma `Decimal` values directly to `res.json()`, and `Decimal` serializes as a JSON **string**.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Fix the API-reachability and money-representation problems once, at a boundary, so the eight following changes inherit the fix rather than each rediscovering it.
- Establish a frontend directory convention that parallels the backend's `modules/<domain>/` layout, so a developer moving between the two finds the same shape.
- Make the responsive shell a working, demonstrable reference implementation, since every domain screen will copy its desktop/mobile pattern.

**Non-Goals:**
- No abstraction over MUI. Screens import MUI components directly; a house component library would be speculative at this stage.
- No global state manager. React Query owns server state; the small amount of client state involved (drawer open/closed) is local.
- No test infrastructure. Verification here is manual, consistent with how the backend changes were verified.

## Decisions

### Proxy under an `/api` prefix, and rewrite the cookie path with it

The browser must see one origin (see the spec's first requirement). The dev server proxies to the backend, but *which* paths it claims is not free — the frontend's own routes collide with the backend's.

```
  naive: proxy the eight real prefixes, frontend calls /buildings
  ────────────────────────────────────────────────────────────────
    browser opens  http://localhost:5173/buildings
                          │
                          ▼
                   proxy claims /buildings
                          │
                          ▼
                   backend returns JSON
                   ✗ the app never loads — you get a JSON dump
```

So API calls are namespaced under `/api`, which no frontend route uses, and the proxy strips that prefix before forwarding. That introduces a second, subtler problem:

```
  /api prefix with a plain rewrite
  ────────────────────────────────────────────────────────────────
    POST /api/auth/login  ──rewrite──▶  POST /auth/login
                                              │
    backend responds:  Set-Cookie: refreshToken=…; Path=/auth
                                              │
    browser stores it for path /auth ─────────┘

    later:  POST /api/auth/refresh
            "/api/auth/refresh" does not start with "/auth"
            ✗ cookie not sent → 401 → session dies on every reload
```

The fix is one more proxy option: rewrite the cookie's `Path` from `/auth` to `/api/auth` as the response passes through, so the path the browser stores matches the path the browser will use. Vite's proxy forwards its options to `http-proxy`, which supports this directly.

Alternatives considered. *Configuring `cors({ origin, credentials: true })` on the backend*: a backend change plus a new required env var, and it leaves `SameSite=Strict` working only because `localhost:5173` and `localhost:5000` share a site — ports are not part of a site, so this passes locally and fails on any split-domain deployment. *Mounting the backend routers under `/api`*: cleaner in the long run and worth revisiting when deployment is designed, but it is a backend change for a frontend concern, and the cookie path is a literal in the auth controller so it would need editing anyway. *Proxying the eight real prefixes and prefixing the frontend's own routes instead* (`/app/buildings`): avoids the cookie problem entirely, at the cost of an ugly URL on every screen the user actually sees.

The trade being accepted: one non-obvious proxy option, documented here, in exchange for clean URLs on both sides and zero backend change. `web-auth` is where this is proven — it is the only change that exercises the cookie.

The backend's port is configurable and `5000` collides with macOS AirPlay Receiver, so the proxy target reads from an environment variable with a default rather than being hardcoded.

### Money is converted per-response, not by a global interceptor

A global interceptor that walks every response and numifies anything digit-shaped is the tempting version. It is also wrong here:

```
  phone      "0334974582"  ──▶  334974582    ✗ leading zero destroyed
  roomCode   "0101"        ──▶  101          ✗ no longer matches the room
  year/month  2026, 8            fine, already numbers
  rentAmount "3000000"     ──▶  3000000      ✓ the only case wanted
```

The seeded owner's phone number is exactly this shape, so the failure is not hypothetical. Instead, the API client exposes a small conversion helper, and each domain's response mapper names the monetary fields explicitly. It is a few lines per domain and it cannot silently corrupt a neighbouring field.

Conversion targets `number`, not a decimal library. These are Vietnamese dong amounts, already rounded to whole units by the backend (`toDecimalPlaces(0)`), and well inside the range integers are exact in. The frontend only displays and sorts them — every arithmetic decision was made server-side. A decimal library would be weight for a precision problem this application does not have.

Absent and null values pass through untouched; `null` must not become `0`, since the two mean different things on an optional expense field.

### One error type at the client boundary

Every failure — a structured backend error, a timeout, a proxy failure, an HTML error page from something upstream — is normalized into a single error type carrying status, code, message, and optional field details. Screens branch on that, never on the raw response.

The awkward case is the failure with no response at all. Giving it status `0` invites `if (status >= 400)` checks to miss it, so it carries an explicit marker distinguishing "the server rejected this" from "this never arrived" — a distinction that matters because the two deserve different retry behavior, and React Query's retry defaults are configured from it.

### React Query defaults chosen against the backend's actual semantics

`retry` must not apply to 4xx. A 400 from a zod schema, a 403 from `requireRole`, a 404 from `parse-id`, or a 409 from a partial unique index are all deterministic — repeating them produces the same answer three times and delays the error the user needs to see. Retry is enabled only for transport failures and 5xx.

`staleTime` is set to a small non-zero value rather than the default `0`. With `0`, mounting two components that read the same list refetches on every navigation; a few seconds removes that without risking a stale read, because mutations invalidate explicitly.

### Directory layout mirrors the backend

`@/` maps to `frontend/src/`, requiring both a `tsconfig` path mapping (for the typechecker) and a Vite `resolve.alias` (for the bundler) — they are independent and both are needed.

```
frontend/src/
  main.tsx            entry
  app/
    router.tsx        route table
    query-client.ts   React Query defaults
    theme.ts          MUI theme + breakpoints
  layouts/
    AppShell.tsx      the responsive shell
  lib/
    api-client.ts     the single HTTP instance
    api-error.ts      the normalized error type
    money.ts          the conversion helper
  features/<domain>/  ← added by later changes, one per backend module
    api.ts            request functions      (≈ backend service.ts)
    types.ts          response types         (≈ backend schema.ts)
    hooks.ts          React Query hooks
    pages/            screens
  pages/              shell-level pages (not-found)
```

`features/<domain>/` deliberately parallels `backend/src/modules/<domain>/`. Domain names match the backend's exactly, so `features/invoices/` and `modules/invoices/` are obviously counterparts.

### The responsive shell

Three techniques carry the whole application; every domain screen will reuse them, so the shell is written as the reference.

**Mobile-first.** Styles are written for the narrow case as the default and *added to* as the viewport widens. Written the other way — desktop first, then overriding downward — every new component starts by fighting rules it inherited. MUI's breakpoints are `xs / sm(600) / md(900) / lg(1200) / xl(1536)`; this application treats **`md` as the single divide** between "phone or small tablet" and "desktop". One breakpoint, not five, because the layout genuinely has two forms and inventing intermediate ones creates states nobody will check.

**Navigation swaps component, not size.** The mistake is one drawer that gets narrower. The correct version is two drawer variants sharing one list of destinations:

```
        ≥ md  (desktop)                 < md  (phone)
   ┌────────┬──────────────┐       ┌──────────────────┐
   │        │  AppBar      │       │ ☰   Buildings    │  AppBar,
   │  nav   ├──────────────┤       ├──────────────────┤  full width
   │        │              │       │                  │
   │ perm-  │   <Outlet/>  │       │    <Outlet/>     │  content
   │ anent  │              │       │                  │  full width
   │ drawer │              │       │                  │
   └────────┴──────────────┘       └──────────────────┘
                                    ☰ → temporary drawer
     always visible                   slides over content,
     never dismissable                closes on select or
                                       on backdrop tap
```

The `variant="permanent"` and `variant="temporary"` drawers render the same nav list; only the wrapper differs. Selecting a destination closes the temporary one — otherwise it stays open, covering the page it just navigated to, which is the single most common bug in hand-rolled versions of this.

Whether both variants are mounted with CSS visibility, or one is chosen via a `useMediaQuery` hook, matters: the CSS approach avoids a flash on first paint (the media query hook returns `false` on the server-less first render before it evaluates), so both are mounted and MUI's `sx` `display` toggling decides which is visible.

**Tables become cards under `md`.** Not part of this change — there is no data yet — but the shell must not prevent it, so the content area imposes no fixed minimum width and no horizontal overflow of its own. Wide content scrolls inside its own container. This is why the spec requires the shell never to scroll horizontally: a single overflowing table on one screen otherwise breaks the layout of every screen.

Placeholder routes for all eight domains exist so this behavior is demonstrable and verifiable now, rather than being asserted and first exercised three changes later.

### TypeScript conversion over a fresh scaffold

The existing `frontend/` is regenerated rather than replaced: its `node_modules`, `.gitignore`, and git history stay. Conversion is renaming two files, adding `tsconfig.json` and `tsconfig.node.json`, adding the `typescript` and `@types/*` dev dependencies, and adding a `typecheck` script so `tsc --noEmit` is a verification step here exactly as it is on the backend.

Strictness matches the backend — `strict: true`. Turning it on later, against eight domains of existing screens, is the migration nobody performs.

## Risks / Trade-offs

- [The `cookiePathRewrite` proxy option is obscure, and removing it breaks sessions in a way that looks like an auth bug rather than a config bug] → the exact failure chain is documented above and a comment marks the option in the config; `web-auth` verifies it explicitly as a task rather than assuming it.
- [The dev proxy has no production counterpart, so the deployed app will need a reverse proxy or a rethought origin story] → intended: this is a demo build, and a reverse proxy is the conventional production answer, so the dev setup rehearses the right shape rather than a throwaway one.
- [Naming money fields per domain means a new monetary field can be forgotten, silently arriving as a string] → contained by typing responses: a field typed `number` that arrives as a string surfaces at the first arithmetic or comparison rather than never, and the alternative (global coercion) fails in a way that corrupts data instead.
- [Converting to `number` discards decimal precision the backend models with `Decimal`] → amounts are whole-dong and rounded server-side before transport; the frontend performs no arithmetic that could compound error. Revisit only if the frontend ever computes a total rather than displaying one.
- [MUI is a large dependency for a demo] → accepted, chosen deliberately over Tailwind; the responsive drawer, table, and form primitives are exactly what this application is made of, and hand-rolling them is the larger cost.
- [Placeholder routes may be mistaken for unfinished work if the following changes stall] → each renders an explicit "provided by `web-<domain>`" marker naming the change that replaces it.
- [`strict: true` from the start will make the first domain change slower while API response types are written] → that is the cost being paid on purpose; the types are written once and every subsequent screen reads them.

## Migration Plan

Nothing is deployed and nothing consumes the frontend, so there is no rollout concern. Sequence within the change: convert to TypeScript and confirm `tsc --noEmit` passes on the untouched scaffold first, then add the alias and proxy, then the providers, then the shell. Each step leaves the dev server running, so a break is attributable to the step that caused it.

Rollback is discarding the branch; no backend, database, or published artifact is touched.

## Open Questions

- Whether the eight nav destinations should be flat or grouped (property / tenancy / money) is a presentation choice that can be made once real screens exist. It changes no requirement and no task.
