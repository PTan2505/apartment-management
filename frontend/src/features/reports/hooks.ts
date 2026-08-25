import { useQuery } from '@tanstack/react-query'

import * as reportsApi from '@/features/reports/api'
import type { RevenueReportParams } from '@/features/reports/types'

export function useRevenueReport(params: RevenueReportParams) {
  return useQuery({
    queryKey: ['reports', 'revenue', params],
    queryFn: () => reportsApi.getRevenueReport(params),
  })
}
