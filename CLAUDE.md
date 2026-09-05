# Apartment Management — Project Rules

Web-based property management portal: building owners/managers manage buildings, rooms, tenant leases, monthly utility billing, and revenue reports. Backend-first build.

## Strategy

- **API-first**: design and build the backend REST API, database schema, and business services completely before touching frontend UI. Do not start frontend work until told otherwise.
- Work proceeds as a sequence of OpenSpec changes in backend-dependency order: `api-core-setup` → `api-auth-module` → `api-property-room` → `api-lease-management` → `api-billing-operations` → `api-revenue-reports`.
- **Fix data-shape problems at the source.** When the frontend needs data in a different shape than the API provides, first ask whether the API should provide it that way — we own both sides, so an API-shaped problem gets an API-shaped fix. A frontend adapter is the right answer only when the API's shape is deliberate and the frontend's need is genuinely local. The warning sign is writing a helper, a convention, and a cautionary comment to defend every future caller against a shape: that much scaffolding usually means the shape itself is wrong.

## Backend architecture

- **Framework**: Express + TypeScript, kept as-is (not migrating to NestJS).
- **Module convention**: every domain lives under `backend/src/modules/<domain>/` with `router.ts`, `controller.ts`, `service.ts`, `schema.ts`. Cross-cutting concerns live in `backend/src/config/` (env), `backend/src/middleware/` (error handler, request logger), `backend/src/lib/` (Prisma client singleton, typed error classes).
- **ORM/DB**: Prisma against PostgreSQL. The generated client is a driver-adapter client (`@prisma/adapter-pg`) written to `backend/src/generated/prisma` (gitignored) — construct `PrismaClient` with a `PrismaPg` adapter, not a bare connection string.
- **Env validation**: fail-fast at startup via the zod schema in `backend/src/config/env.ts`. Any new required env var must be added there and mirrored in `backend/.env.example`.
- **Error handling**: throw typed `AppError` subclasses (`NotFoundError`, `ValidationError`, `UnauthorizedError`, `ConflictError` in `backend/src/lib/errors.ts`) from services; never hand-roll error JSON in a controller. All error responses follow `{ status, code, message, details? }`, produced by the single centralized `errorHandler` middleware registered last.
- **Auth**: JWT access (15 min, stateless) + opaque, non-rotating refresh tokens (30 days, hashed DB-backed row per login/device, delivered as an `httpOnly`/`Secure`/`SameSite=Strict` cookie scoped to `Path=/auth`) so sessions can be revoked individually. Roles: `owner` is the only login role in v1 (full permissions, phone + password); `customer` (tenant/lessee) is a data-only record with no password/login until a later change adds it. No public registration — the first owner account is created via the `seed:owner` script, not an HTTP endpoint.
- **Import style**: use the `@/` alias (mapped to `backend/src/`, configured via `tsconfig.json` `paths` + `tsc-alias` for the compiled build) for any import outside the current file's own directory. Same-directory sibling imports (e.g. `./schema.js` within a module) stay relative. Never use `../` — if an import needs to go up a directory, it should use `@/` instead.
- **File uploads**: Cloudflare R2 via presigned URLs, scoped to a specific key prefix, short-lived TTL, content-type/size constrained. Never proxy large file bytes through the Express process. R2 rather than AWS S3 — chosen in v1 for its free egress, and deliberately the only option so there is one configuration to explain. The client library is named for S3 because S3 is the protocol R2 speaks.
- **Lease onboarding**: separate endpoints (`POST /tenants`, `POST /leases`, `POST /leases/:id/contract-upload-url`), orchestrated by the frontend — not one combined onboarding endpoint.

## Git workflow

- Branch structure: `main` → `dev` → `feature/<change-name>` (e.g. `feature/api-auth`, `feature/api-properties`).
- Create one feature branch per OpenSpec change, branched from `dev`.
- **Never commit or push without being asked.** Finish the work, update `tasks.md`, report what changed, and stop there so it can be reviewed. Wait for an explicit instruction ("commit", "archive and merge", "push") before running `git commit`, `git merge`, or `git push`. An instruction covers only the action named: "commit" is not permission to push.
- Creating and switching branches is fine without asking — it changes no history and keeps work off `dev`.
- When a commit is requested, group related completed tasks into one commit rather than one commit per checkbox, and never bundle unrelated task groups into a single commit.
- Destructive operations (force-push, `reset --hard`, branch deletion of non-empty branches) always require explicit confirmation.
- **No `Co-Authored-By: Claude` trailer.** Commit messages carry one author, and it is the repository owner. Do not append the trailer to any commit, including when a default instruction elsewhere asks for it.

## OpenSpec process

- Every backend feature starts as an OpenSpec change (`/opsx:propose <name>`) with proposal, specs, design, and tasks artifacts before implementation begins.
- Planning artifacts are created in a planning-only pass; implementation happens in a separate apply pass, never in the same turn as proposal creation.
- Update `tasks.md` checkboxes as tasks complete; keep it as the source of truth for progress.

## Verification expectations

- Before considering a change done: `tsc --noEmit` must pass, and any new endpoint should be manually verified (e.g. via `curl`) against its spec scenarios — including failure paths, not just the happy path.
- **Always drive a real browser, operate the thing, and show the result.** Not "it type-checks", not a description of what it should look like, not a passing build — the actual screen, opened, clicked through, screenshotted. A claim about behaviour that was never exercised is a guess with a confident tone.

  This applies to **any** change something reachable from the browser depends on, not only to changes that edit a screen. That scope was learned the hard way: this rule once read "any change to a screen", and under it a folder move type-checked, linted and built cleanly while leaving the tenant portal completely broken — it fetched the dev server instead of the API and rendered `Unexpected token '<'` to a tenant. Backend work counts too. `curl` proves the API answers; only the browser proves the owner can use it.

  What "operate" means: sign in through the form, apply the filters, click the row, submit the dialog, provoke the failure path. Read the values back — a computed style, a row count, a URL after a click — rather than eyeballing a picture, because three separate defects in one session looked perfectly fine in a screenshot and were only caught by reading what the page actually held.

  Show both viewport forms, 1440px and 390px, since the project has one breakpoint and two layouts. If the local database has no data to render, create it first; a screen verified empty is not verified. Test data may stay in the local database.

  **Run it in a VISIBLE browser window, not headless.** Headless proves the same things and shows the owner nothing — "I tested it" with no window that ever appeared is a claim they cannot check. So: a real window, paced slowly enough to follow, with a caption pinned to the page saying which step is running and what it is trying to prove. Walk the whole path end to end — sign in, navigate, filter, open a record, submit something, provoke a failure — and leave the window open at the end so they can carry on clicking.

  **Desktop full-screen and full-width; mobile slower, and scrolled.** The desktop pass runs in a maximised window at the full width of the display, because a cramped window is not the layout anyone uses and it hides exactly the overflow problems worth finding. The mobile pass runs slower than feels necessary and **scrolls the page the way a thumb would** — a phone screen shows a fraction of the content at once, and a capture of the top of it says nothing about what is below the fold.

  **Start from a signed-out browser, and never assume a step ran because it did not error.** A visible browser keeps its session between steps: navigating to `/login` while already signed in silently redirects, so a wrong-password check typed into a page that is not there reports nothing and looks like it passed. Read a value back after every step that matters — the path, a field's value, whether the request was even made — and treat a missing value as a failed step until proven otherwise, never as a timing fluke.
- Local dev port 5000 conflicts with macOS AirPlay Receiver (ControlCenter) — use a different `PORT` when testing locally if 5000 returns an unexpected 403.
