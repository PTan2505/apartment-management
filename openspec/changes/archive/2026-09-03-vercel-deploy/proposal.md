## Why

Deploying the owner's application is a manual step, done from a laptop, by whoever remembers to do it. That is fine while one person is building it and becomes a liability the moment the application is in use: the deployed version is whatever somebody last pushed by hand, and nothing records which commit that was.

There is a second, quieter problem. CI checks the backend and the specs, and **does not check the frontend at all** — no typecheck, no build. The frontend is now most of the product, and every one of its regressions has been caught by a person running `npm run build` locally and remembering to look.

Those two belong together. A deploy worth automating is one gated on the checks passing, and there is no frontend check to gate on.

## What Changes

- **CI builds the frontend**, both bundles: the owner's application and the tenant portal. The portal has its own config and its own required settings, and has never been built by anything but a person.
- **A push to `main` deploys the owner's application to Vercel**, and only after every check has passed — backend, specs, and both frontend bundles.
- **A failed check means no deploy.** The point of gating is that the deployed version is one that passed, not one that happened to be pushed.
- **Nothing deploys from `dev`.** `dev` is where work integrates and is expected to be broken sometimes; `main` is what is released.

Deliberately NOT in this change:

- **Deploying the tenant portal.** It is built and checked here, but where it should live — a second Vercel project, a path on the same one — is a decision nobody has made, and guessing it would put a tenant-facing surface somewhere by accident.
- **Deploying the backend.** Render already watches `main` on its own.
- **Preview deploys for pull requests.** Useful, and a separate decision about who may see an unreleased build.
- **Merging `dev` into `main`.** The pipeline is being built; releasing through it is a decision for its owner.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is tooling: a CI job and a deploy step. Nothing about how the system behaves changes, so there is nothing for a spec to describe.

## Impact

- `.github/workflows/ci.yml` — a frontend job.
- `.github/workflows/deploy.yml` — the deploy, gated on CI.
- Repository secrets, which must be added by hand: a Vercel token and the project's identifiers.
- Vercel's own Git auto-deploy must be turned off, or every push will deploy twice.
