## Context

See proposal.md — Why. What decides the approach:

- `apiClient` uses `baseURL: '/api'` and `withCredentials: true`. The credential flag is already correct for a cross-site deployment.
- The dev proxy rewrites the refresh cookie's `Path` from `/auth` to `/api/auth`, because the application calls `/api/auth/refresh` and a cookie scoped to `/auth` would not be sent.
- The backend sets that cookie at `Path=/auth`, and its cross-site settings (`WEB_ORIGINS`, `CROSS_SITE_COOKIES`) already exist.
- The tenant portal already addresses its API absolutely and refuses to build without an address.

## Goals / Non-Goals

**Goals:**

- A deployed application that reaches its API.
- A build that fails rather than shipping one that cannot.

**Non-Goals:**

- Any backend change.
- Changing local development.

## Decisions

**An absolute address, not a Vercel rewrite.**

A rewrite would keep both halves on one origin, which is tidier in principle and wrong in practice here: Vercel does not rewrite `Path` in a `Set-Cookie`. The backend would set `Path=/auth`, the browser would store it there, and the application — calling `/api/auth/refresh` — would never send it. Every reload would end the session.

The dev proxy solves exactly this with `cookiePathRewrite`, and that is a Vite feature with no counterpart in a Vercel rewrite. Making it work would mean teaching the backend to serve its cookie at a path chosen by whatever proxies it: a setting that exists only to satisfy one host's limitation.

Addressing the API directly avoids the question. The application calls `https://api.example.com/auth/refresh`, the cookie is scoped to `/auth` on that origin, and the paths agree without anybody rewriting anything.

**The build refuses rather than defaulting.**

A default would be a guess about somebody's deployment, and the wrong guess ships an application that looks fine until the first sign-in. The portal already takes this position for the same reason, and this is the second surface to learn it the hard way.

Only a production BUILD refuses. Development has a working relative path and a proxy to serve it.

**A new name rather than reusing `VITE_API_TARGET`.**

That name means the proxy's forwarding target — a dev-server concept. This is the address the browser calls. They coincide in value and not in meaning, and the confusion that produced this bug is exactly that a setting named for one was expected to do the other.

## Risks / Trade-offs

**Someone sets the old name in production and nothing changes** → The build fails and names the setting it wants, so the mistake surfaces at deploy rather than at sign-in.

**The address is baked into the bundle at build time** → True of any Vite client setting, and it means moving the API needs a rebuild. Acceptable: the address changes about as often as the deployment does.

## Migration Plan

None in the code. The deployment needs `VITE_API_URL` set on Vercel, and the backend needs its origin in `WEB_ORIGINS` with `CROSS_SITE_COOKIES=true` — settings that already exist.
