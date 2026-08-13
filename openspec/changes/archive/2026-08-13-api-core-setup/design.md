## Context

`backend/` is currently a bare Express + TypeScript scaffold: `cors`, `dotenv`, `express` as dependencies, and a single `src/server.ts`. There is no database, no ORM, no module structure, and no error handling beyond Express defaults. Five domain changes (`api-auth-module`, `api-property-room`, `api-lease-management`, `api-billing-operations`, `api-revenue-reports`) will each add a module under this structure, so the conventions set here are load-bearing for the rest of the project. See proposal.md for motivation.

Decisions already locked going into this change (from prior architecture discussion): keep Express rather than migrate to NestJS; use Prisma against PostgreSQL; only the `manager` role has a login flow for now (owners are a report audience, not a login role — relevant to later changes, not this one).

## Goals / Non-Goals

**Goals:**
- Establish the `modules/<domain>/{router,controller,service,schema}.ts` convention that every later change will follow.
- Get Prisma talking to PostgreSQL with working migrations, with an empty schema ready for the first model (`User`, in `api-auth-module`).
- Centralize error handling and env validation so every later module inherits them for free instead of reimplementing per-module.
- Provide a health check that verifies both process liveness and DB connectivity, useful for local dev and later deployment.

**Non-Goals:**
- No domain models, no auth, no S3 integration — those are scoped to later changes per the roadmap.
- No production deployment/infra-as-code (e.g. Docker, CI pipeline) — out of scope for this change; can follow once the API has real endpoints.
- No API documentation/OpenAPI generation tooling yet — introduce once real routes exist beyond `/health`.

## Decisions

**Module layout**: `backend/src/modules/<domain>/{router.ts, controller.ts, service.ts, schema.ts}`, plus top-level `backend/src/config/` (env loading/validation), `backend/src/middleware/` (error handler, request logger), and `backend/src/lib/` (Prisma client singleton, shared utilities). Alternative considered: a single flat `routes/`, `controllers/`, `services/` split by layer instead of by domain — rejected because it scatters each domain's files across three directories, making it harder to reason about one module (e.g. billing) in isolation, which matters more as 5+ domains accumulate.

**ORM**: Prisma. Already decided against Drizzle in prior discussion — type-safe generated client and built-in migration CLI reduce boilerplate for a team moving fast through several domain changes in sequence.

**Env validation**: use `zod` to define and parse a typed env schema at startup (`config/env.ts`), throwing and exiting the process if parsing fails. Alternative considered: manual `if (!process.env.X) throw` checks — rejected as error-prone and untyped once the variable list grows past a handful of entries across later changes.

**Error handling**: single Express error-handling middleware (`middleware/error-handler.ts`) registered last, converting thrown errors into the standard JSON shape `{ status, code, message, details? }`. Domain services throw typed error classes (e.g. `NotFoundError`, `ValidationError`) that the middleware maps to HTTP status codes; unrecognized errors default to 500 with a generic message (no stack trace leakage). Alternative considered: try/catch + manual response-shaping in every controller — rejected because it's exactly the kind of per-module duplication this change exists to prevent.

**Logging**: `pino` (or `pino-http` for request logging) — lightweight, structured JSON logs, low overhead, standard choice for Express+TS services.

**Health check DB probe**: on `GET /health`, run a trivial query (e.g. `SELECT 1`) through the Prisma client with a short timeout; treat timeout or error as DB status `"error"` and respond 503 per the spec.

## Risks / Trade-offs

- [Prisma migration drift if a developer edits `schema.prisma` without running `prisma migrate dev`] → document the required workflow in a README note as part of this change's tasks; not automatable further without CI, which is out of scope here.
- [Env validation blocking local dev if `.env.example` isn't kept in sync with the zod schema] → add `.env.example` as a task deliverable, mirrored 1:1 with the schema.
- [Custom typed error classes (`NotFoundError`, etc.) becoming a de facto mini-framework later changes must remember to use] → keep the initial set minimal (3-4 classes covering not-found/validation/unauthorized/conflict) and document the pattern in a short comment at the top of `middleware/error-handler.ts`, since later changes (especially `api-auth-module`) will need `UnauthorizedError` immediately.

## Migration Plan

This is greenfield scaffolding with no existing data or deployed instance, so there is no data migration. Deployment steps: provision a PostgreSQL instance (local Docker or managed) and set `DATABASE_URL`; run `prisma migrate deploy` before starting the server. Rollback is simply reverting the branch/commit, since no persisted domain data exists yet.
