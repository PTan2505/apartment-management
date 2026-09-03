# Tasks

## 1. Check the frontend at all

- [x] 1.1 A CI job that installs and builds the owner's application. `npm run build` typechecks first, so this covers both.
- [x] 1.2 Build the tenant portal too, supplying its own API address. It has its own config and its own refusal to build without one, and has never been built by anything but a person.
- [x] 1.3 Run on the same triggers as the rest of CI — pushes and pull requests against `main` and `dev`.

## 2. Deploy on main

- [x] 2.1 A separate workflow, triggered by CI completing on `main`. Expressing "only main, only after everything passed" inside the existing file would spread the intent across every job.
- [x] 2.2 Deploy only where the CI run SUCCEEDED. A gate that deploys regardless is not a gate.
- [x] 2.3 Deploy only from `main`. `dev` is where work integrates and is expected to break.
- [x] 2.4 Build in CI and upload the result — `--prebuilt` — so what was checked is what ships, rather than the same code built twice with two chances to differ.
- [x] 2.5 Deploy the owner's application only. The portal is built and checked, and where it should live is a decision nobody has made.

## 3. Handover

- [x] 3.1 Document the repository secrets to add.
- [x] 3.2 Say plainly that Vercel's own Git auto-deploy must be turned off, or every push deploys twice.
- [x] 3.3 Note that `main` is behind `dev`, so nothing deploys until a release is merged — and that merging it is not part of this change.

## 4. Verification

- [x] 4.1 The workflows parse as valid YAML and their triggers are what they claim.
- [x] 4.2 The frontend job's commands succeed locally with the same inputs CI supplies.
- [x] 4.3 **The portal build still refuses without its address**, so the job is proving something.
- [x] 4.4 The deploy job's conditions exclude `dev` and exclude a failed CI run — read from the file, since neither can be triggered here.
- [x] 4.5 **Nothing about the existing CI changed**: the backend and specs jobs are untouched.

---

## Handover — what has to be done by hand

### Repository secrets (Settings → Secrets and variables → Actions)

| Secret | Where it comes from |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | `frontend/.vercel/project.json` after `vercel link`, or Vercel → Settings → General |
| `VERCEL_PROJECT_ID` | same place |
| `VITE_API_URL` | `https://apartment-management-api.onrender.com` |

Until these exist the workflow runs and the deploy step fails on a missing
token — visible, and harmless.

### Turn OFF Vercel's own Git auto-deploy

Vercel → Project → Settings → Git → **Ignored Build Step**, or disconnect the
Git integration.

Otherwise every push to `main` deploys twice: once because Vercel is watching
the branch, once from this workflow. Both ship the same commit, so nothing
breaks — but two deploys per push is the sort of thing that is confusing for
months before anybody works out why.

### `main` is behind `dev`

Nothing deploys until a release is merged. Merging it is a decision for its
owner and is deliberately not part of this change.
