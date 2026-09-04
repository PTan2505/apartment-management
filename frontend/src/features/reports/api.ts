import { apiClient } from '@/lib/api-client'
import type { RevenueReport, RevenueReportParams } from '@/features/reports/types'

export async function getRevenueReport(
  params: RevenueReportParams,
): Promise<RevenueReport> {
  const { data } = await apiClient.get<RevenueReport>('/reports/revenue', {
    params: {
      from: params.from,
      to: params.to,
      // Comma-separated: the API accepts either form, and one parameter keeps
      // the address readable when an owner shares or bookmarks it.
      ...(params.buildingIds && params.buildingIds.length > 0
        ? { buildingIds: params.buildingIds.join(',') }
        : {}),
    },
  })
  return data
}
