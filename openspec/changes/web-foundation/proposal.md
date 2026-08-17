## Why

The backend is complete — nine changes, 41 endpoints across eight domains — and nothing consumes it. The frontend is still the untouched Vite scaffold: plain JavaScript, one `App.jsx`, no router, no HTTP client, no UI library.

Before any screen can be built, the frontend needs the things every screen will depend on: a way to reach the API that does not fight the httpOnly refresh cookie, a layout that works on a phone and on a desktop, and one agreed place where server data is fetched and cached. Building those once, deliberately, is cheaper than discovering them eight times while writing eight sets of screens.

This change deliberately stops short of authentication and of any domain screen. It is the equivalent of `api-core-setup`: the scaffolding everything else stands on.

## What Changes

- **BREAKING** (to the scaffold, not to any consumer): the frontend converts from JavaScript to TypeScript. `main.jsx`/`App.jsx` become `.tsx`, a `tsconfig` is added, and the build typechecks. This matches the backend and makes API response shapes checkable rather than guessed.
- Adopt the `@/` import alias in the frontend, mapped to `frontend/src/`, mirroring the backend convention so the repo has one import style.
- Add a Vite dev proxy forwarding API paths to the backend, so the browser sees a single origin. This is what makes the refresh cookie work; see below.
- Add MUI as the UI library, with a theme and `CssBaseline`. Tailwind is deliberately **not** installed — it would duplicate MUI's styling system with a second, incompatible set of spacing and color tokens.
- Add client-side routing with a shell layout, and a **responsive application shell**: a permanently visible navigation sidebar on desktop, replaced by a dismissible drawer behind a menu button on narrow screens.
- Add React Query as the single owner of server state, with shared defaults, plus an axios instance that all requests go through.
- Establish the **API client contract** that every later change depends on: how the base path is resolved, how the backend's `{ status, code, message, details? }` error shape becomes a typed client-side error, and how money values are handled.
- Add placeholder routes for the seven domains so the navigation and its responsive behavior are demonstrable and testable before any real screen exists.

### The two decisions that drive everything downstream

**A dev proxy, not permissive CORS.** The backend mounts bare `cors()`, which sends `Access-Control-Allow-Origin: *` and omits `Access-Control-Allow-Credentials`. A browser discards the response to any credentialed cross-origin request under those headers, so the login response's `Set-Cookie` would never be stored and `POST /auth/refresh` would never carry a cookie. Proxying through the dev server makes requests same-origin, which removes the problem rather than configuring around it — and requires no backend change.

**Money arrives as strings.** The backend returns Prisma `Decimal` values straight to `res.json()`, and `Decimal` serializes as a JSON string: `"3000000"`, not `3000000`. Left alone this produces silently wrong arithmetic and lexicographic sorting (`"9"` above `"10"`). This change establishes where that conversion happens, once, rather than leaving `Number(...)` scattered through components.

## Capabilities

### New Capabilities
- `web-infrastructure`: the frontend's cross-cutting foundations — how the browser application reaches the API, how API errors and money values are normalized before any screen sees them, and how the application shell adapts its navigation between desktop and mobile viewports.

### Modified Capabilities
(none — no backend requirement changes; the proxy decision exists specifically to avoid needing one)

## Impact

- **Code**: `frontend/` throughout — `package.json`, `vite.config`, a new `tsconfig`, the entry point, and a new `src/` structure. No `backend/` file changes.
- **Dependencies added**: TypeScript and React type packages; `react-router`; `@tanstack/react-query`; `axios`; `@mui/material` with its Emotion styling peers and `@mui/icons-material`.
- **Dependencies deliberately not added**: Tailwind (conflicts with MUI's styling system), MUI X DataGrid (does not degrade to a mobile layout), MUI X Date Pickers (native `date`/`month` inputs give better mobile behavior for free).
- **Behavioral change**: none for any existing user — the frontend currently does nothing.
- **Dependencies on other work**: none. This blocks `web-auth`, which in turn blocks every domain screen.
- **Out of scope**: all authentication — login, token storage, the 401-refresh interceptor, and protected routes all belong to `web-auth`. No domain screens. No production build, deployment, or reverse-proxy configuration; the proxy here is the dev server's.
