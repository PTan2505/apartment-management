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

## OpenSpec process

- Every backend feature starts as an OpenSpec change (`/opsx:propose <name>`) with proposal, specs, design, and tasks artifacts before implementation begins.
- Planning artifacts are created in a planning-only pass; implementation happens in a separate apply pass, never in the same turn as proposal creation.
- Update `tasks.md` checkboxes as tasks complete; keep it as the source of truth for progress.

## Verification expectations

- Before considering a change done: `tsc --noEmit` must pass, and any new endpoint should be manually verified (e.g. via `curl`) against its spec scenarios — including failure paths, not just the happy path.
- Local dev port 5000 conflicts with macOS AirPlay Receiver (ControlCenter) — use a different `PORT` when testing locally if 5000 returns an unexpected 403.
