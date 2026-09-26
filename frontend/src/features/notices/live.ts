import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { getAccessToken } from '@/features/auth/token-store'
import { NOTICES_KEY } from '@/features/notices/hooks'

/*
  The package is CommonJS, and Vite pre-bundles it as `export default
  require_dist()` — so the default import is the module OBJECT, with the hook
  one level further in at `.default`. Imported the ordinary way it type-checks,
  builds, and then crashes the whole application at run time with
  "useWebSocket is not a function", which is how this was found: the screen went
  blank in the browser check.

  Unwrapped by asking what it actually is rather than assuming either shape, so
  a bundler that hands over the function directly works too.
*/
import useWebSocketDefault from 'react-use-websocket'

const useWebSocket =
  typeof useWebSocketDefault === 'function'
    ? useWebSocketDefault
    : (useWebSocketDefault as unknown as { default: typeof useWebSocketDefault }).default

declare const __API_URL__: string

/**
 * Where the live channel is, derived from where the API is.
 *
 * In development `__API_URL__` is empty and the dev server proxies `/api` —
 * including the upgrade, which is why `ws: true` is set on that proxy entry.
 * In a build the API's absolute address is known, and `http` becomes `ws` by
 * the same rule browsers use.
 */
function liveUrl(): string {
  const base = __API_URL__ === '' ? `${window.location.origin}/api` : __API_URL__
  return `${base.replace(/^http/, 'ws').replace(/\/$/, '')}/live`
}

export interface NewReportEvent {
  type: 'report.new'
  id: number
  roomCode: string
  buildingName: string
  reportedAt: string
}

/**
 * The live channel: one connection, shared, for as long as somebody is signed
 * in.
 *
 * `share: true` matters — the bell and any screen listening would otherwise
 * open a socket each, and the server would hold two connections per person for
 * one account's events.
 *
 * Authentication is the FIRST MESSAGE, never the URL: a token in a query
 * string is written into the access log every time a socket opens. The browser
 * cannot set a header on a WebSocket, so this is the way that leaves no trace.
 *
 * The access token lives fifteen minutes and this connection lives as long as
 * the tab, so the current token is presented again on every reconnect and
 * whenever the count is refetched — the server replaces the expiry it holds
 * rather than closing a connection that is still in use.
 *
 * Nothing here is load-bearing. Every fact it delivers is also available by
 * asking, and the count refetches on its own; this only makes it immediate.
 */
export function useLiveNotices(enabled: boolean, onNewReport?: (event: NewReportEvent) => void) {
  const queryClient = useQueryClient()

  const authenticate = useCallback((send: (value: unknown) => void) => {
    const token = getAccessToken()
    if (token) send({ type: 'auth', token })
  }, [])

  const { sendJsonMessage, lastJsonMessage } = useWebSocket(
    liveUrl(),
    {
      share: true,
      shouldReconnect: () => true,
      reconnectAttempts: Number.MAX_SAFE_INTEGER,
      // Backs off to half a minute. A server that is asleep — which is what a
      // free host does to an idle service — must not be hammered awake by
      // every open tab.
      reconnectInterval: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
      onOpen: () => authenticate(sendJsonMessage),
      // A closed socket is not an error worth showing anybody: the count is
      // correct without it.
      onError: () => {},
    },
    enabled,
  )

  // Re-presents the current token periodically, so a connection outlives the
  // fifteen minutes of the token it was opened with.
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => authenticate(sendJsonMessage), 5 * 60 * 1000)
    return () => window.clearInterval(timer)
  }, [enabled, authenticate, sendJsonMessage])

  useEffect(() => {
    const event = lastJsonMessage as NewReportEvent | { type: string } | null
    if (!event || event.type !== 'report.new') return

    // The event says something arrived; the API says what. One serialisation
    // of a report, and one place that decides what a role may see.
    void queryClient.invalidateQueries({ queryKey: NOTICES_KEY })
    void queryClient.invalidateQueries({ queryKey: ['damage-reports'] })
    onNewReport?.(event as NewReportEvent)
  }, [lastJsonMessage, queryClient, onNewReport])
}
