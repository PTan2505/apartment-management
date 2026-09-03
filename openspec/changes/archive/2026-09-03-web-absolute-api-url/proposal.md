## Why

The owner's application was deployed to Vercel and cannot reach its API. Every call goes to `https://<the-app>.vercel.app/api/…` instead of the backend, and answers with the Vercel app's own 404.

The cause is that the application has only ever addressed the API relatively, as `/api`, and relied on the dev server's proxy to forward it. `VITE_API_TARGET` configures that proxy — and a Vite `server` setting does nothing in a built bundle. So the deployed application asks its own origin for `/api/auth/login`, which is not there.

Nothing is broken; the production case was simply never given an address. The tenant portal already faced this and was built the other way, addressing its API absolutely with no proxy anywhere.

## What Changes

- **The application takes an absolute API address when one is configured**, and keeps the relative `/api` when none is — so local development, which depends on the proxy, is untouched.
- **A built bundle with no address configured is refused at build time**, rather than shipping an application that will ask its own origin for an API. That failure is invisible until somebody tries to sign in, and reads as a broken deployment rather than a missing setting.
- The setting is named for what it is — the API's address — and distinct from `VITE_API_TARGET`, which names the proxy's forwarding target. Two different things had one name only by accident of never needing the second.

Deliberately NOT in this change:

- **A Vercel rewrite that proxies `/api` to the backend.** It would keep everything same-origin, but Vercel does not rewrite `Path` in a `Set-Cookie` — so the refresh cookie would be stored for `/auth` while the application calls `/api/auth/refresh`, and every reload would sign the owner out. That is precisely the failure the dev proxy's `cookiePathRewrite` exists to prevent, and it cannot be prevented the same way there.
- **Any backend change.** Serving the frontend from another site is what the cross-site cookie and origin settings were built for; they exist and are configured, not modified.

## Capabilities

### Modified Capabilities

- `web-infrastructure`: the application addresses its API absolutely where configured, and refuses to build without an address.

## Impact

- `frontend/vite.config.ts` — the setting, and the build-time refusal.
- `frontend/src/lib/api-client.ts` — the base address.
- `frontend/.env.example` — documenting it.
- No backend change.
