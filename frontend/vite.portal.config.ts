import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The tenant portal, built separately from the owner's application.
 *
 * Separate rather than a public route inside the other one, for two reasons
 * that are not tidiness:
 *
 *   - the owner's API client refreshes the session on a 401, and a tenant has
 *     no session to refresh. Sharing it would mean a flag saying "this request
 *     is not really authenticated", which is the sort of thing that gets
 *     forgotten;
 *
 *   - a tenant opens the link on a phone, on mobile data, to read one bill.
 *     Shipping them the whole of the owner's application to do it is seconds of
 *     waiting for no benefit, and hands them the shape of every screen they
 *     cannot reach.
 *
 * There is no dev proxy here and none is needed: the portal sends no cookie and
 * carries its token in a header, so nothing about it depends on sharing an
 * origin with the API.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Absolute, because there is no proxy in front of this. Empty means the
  // built application would request paths on itself and fail at runtime with
  // a 404 from its own static host, so it is refused here instead.
  const apiUrl = env.VITE_PORTAL_API_URL
  if (!apiUrl) {
    throw new Error(
      'VITE_PORTAL_API_URL is required — the portal addresses the API absolutely and has no proxy.',
    )
  }

  return {
    plugins: [react()],
    // A distinct entry, so the bundle contains what the portal imports and
    // nothing else.
    build: { outDir: 'dist-portal', rollupOptions: { input: 'portal.html' } },
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    define: {
      __PORTAL_API_URL__: JSON.stringify(apiUrl),
    },
  }
})
