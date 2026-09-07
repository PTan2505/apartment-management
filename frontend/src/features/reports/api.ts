import { apiClient } from '@/lib/api-client'
import type { RevenueReport, RevenueReportParams } from '@/features/reports/types'

export async function getRevenueReport(
  params: RevenueReportParams,
): Promise<RevenueReport> {
  const { data } = await apiClient.get<RevenueReport>('/reports/revenue', {
    params: {
      from: params.from,
      to: params.to,
      // Always asked for. The API makes it opt-in so a caller wanting totals
      // does not pay for a room list; this screen exists to show the rooms.
      //
      // Fetched WITH the totals rather than on demand, so the two cannot be
      // read either side of an invoice being issued and disagree.
      detail: 'rooms',
      // Comma-separated: the API accepts either form, and one parameter keeps
      // the address readable when an owner shares or bookmarks it.
      ...(params.buildingIds && params.buildingIds.length > 0
        ? { buildingIds: params.buildingIds.join(',') }
        : {}),
    },
  })
  return data
}
