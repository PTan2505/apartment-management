import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Keeps a list screen's filters and page in the URL.
 *
 * Filters live in the address so a view is shareable, survives a reload, and so
 * the browser's back control undoes the last filter change rather than leaving
 * the screen — which is what people actually expect of a filter panel.
 *
 * ── The page reset is the reason this is shared ─────────────────────────────
 *
 * The API rejects an *invalid* page with a 400, deliberately, rather than
 * clamping. But an out-of-*range* page is not invalid:
 *
 *     page=3, then a filter narrows the results to a single page
 *     → 200, data: [], meta: { total: 1, totalPages: 1 }
 *
 * The screen would show nothing while reporting that a result exists. Every
 * list screen has this hazard, so the reset lives here where it cannot be
 * forgotten, rather than being wired up seven times.
 */

export const PAGE_PARAM = 'page'

export interface ListParams<F extends Record<string, string | undefined>> {
  /** Current filter values, absent keys meaning "not filtered". */
  filters: F
  page: number
  /** Sets one filter (or clears it with undefined) and returns to page 1. */
  setFilter: (key: keyof F & string, value: string | undefined) => void
  /**
   * Sets several filters in one update, and returns to page 1.
   *
   * Required whenever one change implies another — choosing a city that
   * invalidates the selected ward, for instance. Two `setFilter` calls in a row
   * do not compose: each computes from the params it captured, so the second
   * discards the first's change rather than adding to it.
   */
  setFilters: (values: Partial<Record<keyof F & string, string | undefined>>) => void
  /** Clears every filter and returns to page 1. */
  clearFilters: () => void
  setPage: (page: number) => void
  hasFilters: boolean
}

/**
 * Filters whose changes should replace the current history entry rather than
 * push a new one.
 *
 * A dropdown pushes: choosing a city is a step, and back should undo it. A
 * search field must not, or typing five characters leaves five entries and back
 * removes one character at a time instead of leaving the search.
 */
export interface ListParamsOptions<F> {
  replaceKeys?: readonly (keyof F & string)[]
}

export function useListParams<F extends Record<string, string | undefined>>(
  filterKeys: readonly (keyof F & string)[],
  options: ListParamsOptions<F> = {},
): ListParams<F> {
  const replaceKeys = options.replaceKeys ?? []
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const result = {} as F
    for (const key of filterKeys) {
      const value = searchParams.get(key)
      if (value !== null && value !== '') {
        result[key] = value as F[typeof key]
      }
    }
    return result
    // searchParams is a new object on every navigation, which is the signal we
    // want; filterKeys is a stable literal at every call site.
  }, [searchParams, filterKeys])

  const rawPage = Number(searchParams.get(PAGE_PARAM))
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1

  const setFilters = useCallback(
    (values: Partial<Record<keyof F & string, string | undefined>>) => {
      const changed = Object.keys(values) as (keyof F & string)[]
      // Replace only when every key in this update is one that replaces —
      // a mixed update is a real step and should be undoable.
      const replace =
        changed.length > 0 && changed.every((key) => replaceKeys.includes(key))

      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(values)) {
            if (value === undefined || value === '') next.delete(key)
            else next.set(key, value)
          }
          // See the note above: a narrowed result set can be shorter than the
          // page being viewed.
          next.delete(PAGE_PARAM)
          return next
        },
        { replace },
      )
    },
    [setSearchParams, replaceKeys],
  )

  const setFilter = useCallback(
    (key: keyof F & string, value: string | undefined) => {
      setFilters({ [key]: value } as Partial<Record<keyof F & string, string | undefined>>)
    },
    [setFilters],
  )

  const clearFilters = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      for (const key of filterKeys) next.delete(key)
      next.delete(PAGE_PARAM)
      return next
    })
  }, [setSearchParams, filterKeys])

  const setPage = useCallback(
    (nextPage: number) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        // Page 1 is the default, so it stays out of the address rather than
        // cluttering every link with ?page=1.
        if (nextPage <= 1) next.delete(PAGE_PARAM)
        else next.set(PAGE_PARAM, String(nextPage))
        return next
      })
    },
    [setSearchParams],
  )

  return {
    filters,
    page,
    setFilter,
    setFilters,
    clearFilters,
    setPage,
    hasFilters: Object.keys(filters).length > 0,
  }
}
