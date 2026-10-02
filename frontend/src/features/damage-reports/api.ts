import { apiClient } from '@/lib/api-client'
import type { PageMeta } from '@/components/Pagination'
import type { DamageReport, ListReportsParams } from '@/features/damage-reports/types'

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export async function listReports(params: ListReportsParams): Promise<Paginated<DamageReport>> {
  const query: Record<string, string | number | boolean> = {}
  if (params.state) query.state = params.state
  if (params.open) query.open = true
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize

  const { data } = await apiClient.get<Paginated<DamageReport>>('/damage-reports', { params: query })
  return data
}

/** Records the appointment agreed with the tenant, or moves it. */
export async function scheduleReport(
  id: number,
  input: { scheduledFor: string; note?: string },
): Promise<DamageReport> {
  const { data } = await apiClient.post<DamageReport>(`/damage-reports/${id}/schedule`, input)
  return data
}

/** Closes it. A closed report accepts nothing further. */
export async function closeReport(id: number, note: string): Promise<DamageReport> {
  const { data } = await apiClient.post<DamageReport>(`/damage-reports/${id}/close`, { note })
  return data
}

/** A short-lived link to one photograph, signed at the moment it is asked for. */
export async function photoDownload(
  reportId: number,
  photoId: number,
): Promise<{ url: string; expiresAt: string }> {
  const { data } = await apiClient.get<{ url: string; expiresAt: string }>(
    `/damage-reports/${reportId}/photos/${photoId}/download`,
  )
  return data
}

export interface RepairCostInput {
  amount: number
  /** Omitted lets the API date it to the day the report was closed. */
  incurredAt?: string
  description?: string
}

/**
 * Records or corrects what a repair cost. Owner only; the API answers 403 for
 * anybody else.
 *
 * Recording twice corrects the figure — the expense is keyed to the report —
 * so the screen never has to check whether one exists first.
 */
export async function recordRepairCost(
  id: number,
  input: RepairCostInput,
): Promise<DamageReport> {
  const { data } = await apiClient.post<DamageReport>(`/damage-reports/${id}/cost`, input)
  return data
}

export async function removeRepairCost(id: number): Promise<DamageReport> {
  const { data } = await apiClient.delete<DamageReport>(`/damage-reports/${id}/cost`)
  return data
}
