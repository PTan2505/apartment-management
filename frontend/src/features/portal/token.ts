/**
 * The tenant's access token: how it arrives, and where it lives afterwards.
 *
 * It arrives in the URL **fragment** — `…/#t=abc…` — because a browser never
 * transmits a fragment. It therefore reaches no access log, no proxy and no
 * referrer header on the way in. That was decided when the API was built; this
 * is the other half of it.
 *
 * Reading it is not enough. The fragment stays in the address bar, in history,
 * in a bookmark, and in a screenshot of the address bar — which is a thing
 * people send each other. So it is removed as soon as it has been read.
 *
 * Which leaves a problem: a tenant who reloads no longer has a link to reopen,
 * because it is no longer on screen. Hence session storage — scoped to the tab,
 * cleared when the browser closes, which is about as long as somebody looks at
 * a bill.
 *
 * The cost, stated rather than hidden: the token is on disk while the tab is
 * open. Against a tenant unable to reload, that is the better trade for a page
 * showing one person's own bills.
 */
const STORAGE_KEY = 'portal-token'
const FRAGMENT_KEY = 't'

/** Pulls the token out of `#t=…`, or null when the fragment carries none. */
function readFragmentToken(): string | null {
  const fragment = window.location.hash.replace(/^#/, '')
  if (!fragment) return null

  const value = new URLSearchParams(fragment).get(FRAGMENT_KEY)
  return value && value.length > 0 ? value : null
}

/**
 * `replaceState` rather than assigning `location.hash`: assigning it would add
 * a history entry, so Back would put the token straight back in the address
 * bar. This rewrites the current entry in place and navigates nothing.
 */
function stripFragment(): void {
  const { pathname, search } = window.location
  window.history.replaceState(null, '', `${pathname}${search}`)
}

/**
 * The token for this session, taking one from the address bar if it is there.
 *
 * A fragment token always wins over a stored one: opening a fresh link is how
 * somebody switches to a different tenant's bills, and a stale value from an
 * earlier visit would silently override it.
 */
export function resolveToken(): string | null {
  const fromFragment = readFragmentToken()

  if (fromFragment) {
    window.sessionStorage.setItem(STORAGE_KEY, fromFragment)
    stripFragment()
    return fromFragment
  }

  return window.sessionStorage.getItem(STORAGE_KEY)
}

/** Called when the API rejects the token, so a reload does not retry a dead one. */
export function forgetToken(): void {
  window.sessionStorage.removeItem(STORAGE_KEY)
}
