## 1. Project & dependency setup

- [x] 1.1 Create feature branch `feature/api-core-setup`
- [x] 1.2 Add dependencies to `backend/package.json`: `@prisma/client`, `zod`, `pino`, `pino-http`
- [x] 1.3 Add dev dependencies: `prisma`, `typescript` tooling as needed (tsx/ts-node, `@types/node`)
- [x] 1.4 Add `.env.example` with all required variables (`DATABASE_URL`, `PORT`, `NODE_ENV`)

## 2. Module directory structure

- [x] 2.1 Create `backend/src/modules/` (empty, ready for future domain modules)
- [x] 2.2 Create `backend/src/config/env.ts` with a zod schema validating required env vars, exiting the process on failure
- [x] 2.3 Create `backend/src/middleware/` with `error-handler.ts` and `request-logger.ts`
- [x] 2.4 Create `backend/src/lib/` with a Prisma client singleton (`prisma.ts`)
- [x] 2.5 Create typed error classes used by the error handler (e.g. `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ConflictError`) in `backend/src/lib/errors.ts`

## 3. Prisma + PostgreSQL wiring

- [x] 3.1 Initialize Prisma in `backend/` (`prisma/schema.prisma`, `prisma/migrations/`)
- [x] 3.2 Configure `schema.prisma` datasource to use `DATABASE_URL` from env
- [x] 3.3 Confirm `prisma migrate dev` runs cleanly against a local PostgreSQL instance with an empty schema
- [x] 3.4 Document the local Postgres setup and migration workflow in `backend/README.md`

## 4. Error handling & logging middleware

- [x] 4.1 Implement centralized error-handling middleware producing the standard `{ status, code, message, details? }` JSON shape
- [x] 4.2 Map typed error classes to appropriate HTTP status codes; default unrecognized errors to 500 with a generic message (no stack trace leakage)
- [x] 4.3 Wire `pino-http` request logging middleware into the Express app
- [x] 4.4 Register error-handling middleware last, after all routes

## 5. Health check endpoint

- [x] 5.1 Implement `GET /health` performing a lightweight DB probe (e.g. `SELECT 1`) via the Prisma client with a short timeout
- [x] 5.2 Return HTTP 200 with `{ status: "ok", database: "ok" }` when the DB probe succeeds
- [x] 5.3 Return HTTP 503 with `{ status: "error", database: "error" }` when the DB probe fails or times out

## 6. Wire up the app entrypoint

- [x] 6.1 Update `backend/src/server.ts` to load/validate env via `config/env.ts` before starting the server
- [x] 6.2 Register request-logger middleware, module routers (none yet beyond health), and the error handler in the correct order
- [x] 6.3 Confirm the server fails fast with a clear message when a required env var is missing

## 7. Verification

- [x] 7.1 Manually verify `GET /health` returns 200 with DB running
- [x] 7.2 Manually verify `GET /health` returns 503 with DB stopped/unreachable
- [x] 7.3 Manually verify an intentionally thrown error in a temporary test route returns the standard error JSON shape
- [x] 7.4 Commit work in atomic commits per completed task group, on `feature/api-core-setup`
