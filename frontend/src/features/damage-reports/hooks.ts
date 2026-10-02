import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as reportsApi from '@/features/damage-reports/api'
import type { ListReportsParams } from '@/features/damage-reports/types'

const REPORTS_KEY = ['damage-reports'] as const

export function useReports(params: ListReportsParams) {
  return useQuery({
    queryKey: [...REPORTS_KEY, params],
    queryFn: () => reportsApi.listReports(params),
    // What a report says changes without this account doing anything: another
    // member of staff schedules or closes it. The live channel invalidates
    // this key when a new one arrives; this keeps it honest in between.
    staleTime: 0,
  })
}

function useInvalidateReports() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: REPORTS_KEY })
}

export function useScheduleReport() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: number; scheduledFor: string; note?: string }) =>
      reportsApi.scheduleReport(id, input),
    onSuccess: () => void invalidate(),
  })
}

export function useCloseReport() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => reportsApi.closeReport(id, note),
    onSuccess: () => void invalidate(),
  })
}

export function useRecordRepairCost() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: reportsApi.RepairCostInput }) =>
      reportsApi.recordRepairCost(id, input),
    onSuccess: invalidate,
  })
}

export function useRemoveRepairCost() {
  const invalidate = useInvalidateReports()
  return useMutation({
    mutationFn: (id: number) => reportsApi.removeRepairCost(id),
    onSuccess: invalidate,
  })
}
