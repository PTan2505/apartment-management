import { apiClient } from '@/lib/api-client'

/**
 * A notice: something that happened in a building this account covers.
 *
 * It carries the state of the report it announces, so one already dealt with
 * can say so rather than vanishing — a list that erases what was handled
 * cannot answer "was anything reported while I was away".
 */
export interface Notice {
  id: number
  createdAt: string
  readAt: string | null
  report: {
    id: number
    description: string
    state: 'new' | 'scheduled' | 'done'
    reportedAt: string
    roomCode: string
    building: { id: number; displayName: string }
  }
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ unread: number }>('/damage-reports/notices/unread-count')
  return data.unread
}

export async function listNotices(): Promise<Notice[]> {
  const { data } = await apiClient.get<{ data: Notice[] }>('/damage-reports/notices')
  return data.data
}

/**
 * Marks this account's notices read.
 *
 * Its own call rather than a side effect of fetching the list: the application
 * refetches in the background, and a count that cleared itself then would
 * clear while nobody was looking at it.
 */
export async function markNoticesRead(): Promise<void> {
  await apiClient.post('/damage-reports/notices/read')
}
