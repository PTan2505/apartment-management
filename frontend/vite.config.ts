import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The path the browser calls. Namespaced so it cannot collide with the
 * application's own routes — if the proxy claimed `/buildings`, then opening
 * `/buildings` in the browser would return JSON and the app would never load.
 */
const API_PREFIX = '/api'

/** Where the backend mounts its refresh cookie (see backend auth controller). */
const BACKEND_COOKIE_PATH = '/auth'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // Third argument '' loads every var, not just those prefixed VITE_ — the
  // proxy runs in Node, so it is not restricted to the client-exposed subset.
  const env = loadEnv(mode, process.cwd(), '')

  // Port 5000 collides with macOS AirPlay Receiver, so this is configurable
  // rather than hardcoded.
  const apiTarget = env.VITE_API_TARGET ?? 'http://localhost:5000'

  /**
   * The address the BROWSER calls, which is a different thing from the proxy's
   * forwarding target above — they coincide in value and not in meaning, and
   * expecting the one named for the proxy to do this job is what shipped an
   * application that asked its own origin for the API.
   *
   * Empty leaves the relative `/api`, which the dev server proxies.
   */
  const apiUrl = env.VITE_API_URL ?? ''

  // A built bundle has no proxy behind it, so an empty address means shipping
  // an application that cannot reach its API — a failure that appears only when
  // somebody tries to sign in, and reads as broken rather than unconfigured.
  if (command === 'build' && apiUrl === '') {
    throw new Error(
      'VITE_API_URL is required for a production build — without it the bundle ' +
        'calls its own origin for the API, which only fails at the first sign-in.',
    )
  }

  return {
    plugins: [react()],

    define: {
      __API_URL__: JSON.stringify(apiUrl),
    },

    resolve: {
      alias: {
        // Mirrors the `paths` mapping in tsconfig.json. Both are required and
        // independent: tsconfig satisfies the typechecker, this satisfies the
        // bundler. Changing one without the other breaks at the other's stage.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      proxy: {
        [API_PREFIX]: {
          target: apiTarget,
          changeOrigin: true,

          // The backend mounts its routers at the root, so strip the namespace
          // before forwarding: /api/buildings -> /buildings
          rewrite: (path) => path.replace(new RegExp(`^${API_PREFIX}`), ''),

          // ---------------------------------------------------------------
          // DO NOT REMOVE. This is what keeps sessions alive.
          //
          // The backend sets the refresh token as `Set-Cookie: …; Path=/auth`.
          // Without this rewrite the browser stores the cookie for `/auth`,
          // but the app calls `/api/auth/refresh` — and `/api/auth/refresh`
          // does not start with `/auth`, so the cookie is never sent. The
          // symptom is a 401 from refresh on every reload, which looks like an
          // authentication bug rather than a proxy misconfiguration.
          // ---------------------------------------------------------------
          cookiePathRewrite: {
            [BACKEND_COOKIE_PATH]: `${API_PREFIX}${BACKEND_COOKIE_PATH}`,
          },
        },
      },
    },
  }
})
