# Backend

Express + TypeScript API for the apartment management portal.

## Setup

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` for a local PostgreSQL instance.
2. Install dependencies: `npm install`
3. Apply database migrations: `npm run prisma:migrate`
4. Start the dev server: `npm run dev`

## Database / Prisma workflow

Schema lives at `prisma/schema.prisma`. The generated client is written to `src/generated/prisma` (gitignored) and imported from `src/lib/prisma.ts`.

- After changing `prisma/schema.prisma`, run `npm run prisma:migrate` to create and apply a migration and regenerate the client. Do not edit `prisma/schema.prisma` without following this with a migration — the schema file and the migrations directory must stay in sync, or `prisma migrate dev` will report drift on the next run.
- To regenerate the client without creating a migration (e.g. after `git pull`), run `npm run prisma:generate`.
- To apply existing migrations in a fresh environment (e.g. CI, first-time setup) without generating a new one, run `npx prisma migrate deploy`.

## Project structure

- `src/modules/<domain>/` — one directory per domain module (`router.ts`, `controller.ts`, `service.ts`, `schema.ts`). Empty for now; auth, properties, rooms, leases, billing, and reports modules are added in later changes.
- `src/config/` — environment loading and validation (`env.ts`).
- `src/middleware/` — cross-cutting Express middleware (error handler, request logger).
- `src/lib/` — shared utilities (Prisma client singleton, typed error classes).
