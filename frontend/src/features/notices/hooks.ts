import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as noticesApi from '@/features/notices/api'

export const NOTICES_KEY = ['notices'] as const

/**
 * How many notices are waiting.
 *
 * Refetched on its own schedule as well as being pushed at: the live channel
 * is best-effort, and a count that only moved when a socket delivered would be
 * wrong for anybody whose connection never opened.
 */
export function useUnreadNoticeCount() {
  return useQuery({
    queryKey: [...NOTICES_KEY, 'unread'],
    queryFn: noticesApi.getUnreadCount,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

/**
 * The notices themselves, fetched while the panel is open.
 *
 * `staleTime: 0` against the application's thirty-second default, because what
 * a notice SAYS changes without this account doing anything: somebody else
 * schedules or closes the report it announces. Left on the default, reopening
 * the panel within half a minute showed the old state — caught in the browser,
 * where a report closed in another window still read "Chưa xử lí".
 */
export function useNotices(enabled: boolean) {
  return useQuery({
    queryKey: [...NOTICES_KEY, 'list'],
    queryFn: noticesApi.listNotices,
    enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useMarkNoticesRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: noticesApi.markNoticesRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTICES_KEY }),
  })
}
