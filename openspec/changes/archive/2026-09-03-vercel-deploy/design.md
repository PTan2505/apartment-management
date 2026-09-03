## Context

See proposal.md — Why. What exists:

- `ci.yml` runs on push and pull request against `main` and `dev`: a backend job (install, generate, typecheck, build, and a smoke check that the built server answers `/health`) and an OpenSpec validation job. No frontend job.
- The frontend has two entries with separate configs: the owner's application (`vite.config.ts`, `dist`) and the tenant portal (`vite.portal.config.ts`, `dist-portal`).
- Both refuse to build without their API address — `VITE_API_URL` and `VITE_PORTAL_API_URL` — deliberately, so a bundle that cannot reach its API is never produced.
- Render already deploys the backend from `main`.
- The application is currently deployed to Vercel by hand.

## Goals / Non-Goals

**Goals:**

- The deployed version is one that passed every check.
- The frontend is checked at all.
- One place to look for what was deployed and from which commit.

**Non-Goals:**

- Deploying the portal or the backend.
- Preview deploys.
- Releasing anything.

## Decisions

**GitHub Actions rather than Vercel's own Git integration.**

Vercel can deploy on push by itself, with no code at all, and for a frontend-only repository that would be the right answer. It is the wrong one here because it would deploy on the frontend's build alone — a commit that breaks the backend or leaves the specs malformed would still ship the frontend, and this repository deliberately runs those checks on everything that could become a release.

The cost is real and is stated: Vercel's Git auto-deploy has to be turned off, or every push deploys twice — once from Vercel watching the branch and once from the workflow. Two deploys of the same commit are harmless and the confusion is not.

**The build happens in CI, and Vercel receives the output.**

`vercel deploy --prebuilt` uploads an already-built directory. The alternative — letting Vercel build — would mean the same code built twice, once to check it and once to ship it, with two chances to differ. Building once and shipping what was checked removes that gap.

It also means `VITE_API_URL` lives in the repository's secrets rather than Vercel's project settings, which is a move, not an improvement: one fewer place to look, one more secret to manage. Worth it for the guarantee that what was tested is what was shipped.

**Deploy is a separate workflow that waits on CI, not a job inside it.**

CI runs on `dev` and on pull requests, where deploying would be wrong. Expressing "only on main, only after everything passed" as a condition inside the existing workflow means every job carries a branch check and the intent is spread across the file. A second workflow triggered by the first's completion says it once.

**The frontend job builds both bundles and typechecks once.**

`npm run build` already typechecks. The portal build does too, and needs its own address supplied. Both are built because both can break, and only one is deployed — which is a deliberate asymmetry, not an oversight.

## Risks / Trade-offs

**Double deploys until Vercel's integration is disabled** → Named in the handover; harmless while it lasts, since both deploy the same commit.

**A secret is missing and the deploy fails** → It fails loudly, on `main`, having already passed every check — so the failure is about credentials rather than code, which is what the log will say.

**CI now takes longer** → Two more bundle builds, both small. The alternative is a frontend nobody checks.

## Migration Plan

The workflow is inert until the repository secrets exist. Adding them is a one-time manual step; until then a push to `main` runs every check and the deploy step fails on a missing token, which is visible and harmless.
