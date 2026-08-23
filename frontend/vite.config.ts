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
export default defineConfig(({ mode }) => {
  // Third argument '' loads every var, not just those prefixed VITE_ — the
  // proxy runs in Node, so it is not restricted to the client-exposed subset.
  const env = loadEnv(mode, process.cwd(), '')

  // Port 5000 collides with macOS AirPlay Receiver, so this is configurable
  // rather than hardcoded.
  const apiTarget = env.VITE_API_TARGET ?? 'http://localhost:5000'

  return {
    plugins: [react()],

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
