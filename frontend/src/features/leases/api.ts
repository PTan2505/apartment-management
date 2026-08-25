import { apiClient } from '@/lib/api-client'
import type { CreateLeaseFormOutput, UpdateLeaseFormOutput } from '@/features/leases/schema'
import type { Lease, ListLeasesParams, Occupant, Paginated } from '@/features/leases/types'

function toQuery(params: ListLeasesParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.roomId) query.roomId = params.roomId
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.customerId) query.customerId = params.customerId
  // Absent means both running and ended, so only a decided value is sent.
  if (params.active !== undefined) query.active = params.active ? 'true' : 'false'
  if (params.overdue) query.overdue = 'true'
  return query
}

export async function listLeases(params: ListLeasesParams): Promise<Paginated<Lease>> {
  const { data } = await apiClient.get<Paginated<Lease>>('/leases', { params: toQuery(params) })
  return data
}

export async function getLease(id: number): Promise<Lease> {
  const { data } = await apiClient.get<Lease>(`/leases/${id}`)
  return data
}

/** Answers 409 when the room acquired a tenancy since the form was opened. */
export async function createLease(input: CreateLeaseFormOutput): Promise<Lease> {
  const { data } = await apiClient.post<Lease>('/leases', input)
  return data
}

/** Answers 409 on a lease that has recorded a move-out. */
export async function updateLease(id: number, input: UpdateLeaseFormOutput): Promise<Lease> {
  const { data } = await apiClient.patch<Lease>(`/leases/${id}`, input)
  return data
}

/**
 * Records that a tenancy never took place, and settles whatever deposit was
 * held against it.
 *
 * Both amounts are sent together or neither is. Where a holding exists the API
 * requires them to account for all of it and answers 400 otherwise; where
 * nothing was collected it answers 400 for amounts sent anyway. Answers 409 on
 * a tenancy that has been billed a month, has ended, or was already cancelled.
 */
export async function cancelLease(
  id: number,
  settlement: { depositReturned: number; depositKept: number } | null,
): Promise<Lease> {
  const { data } = await apiClient.post<Lease>(`/leases/${id}/cancel`, settlement ?? {})
  return data
}

export async function listOccupants(leaseId: number): Promise<Paginated<Occupant>> {
  const { data } = await apiClient.get<Paginated<Occupant>>(`/leases/${leaseId}/occupants`, {
    // Occupants of one tenancy are few, and the screen shows the whole history
    // rather than paging it — somebody who left is the point of the record.
    params: { pageSize: 200 },
  })
  return data
}

/** Answers 409 when that person is already a current occupant. */
export async function addOccupant(leaseId: number, customerId: number): Promise<Occupant> {
  const { data } = await apiClient.post<Occupant>(`/leases/${leaseId}/occupants`, { customerId })
  return data
}

/**
 * Answers 409 when the occupant is the one responsible and others remain —
 * responsibility has to pass to somebody first. `DepartOccupantDialog` performs
 * that transfer rather than surfacing the refusal.
 */
export async function departOccupant(
  leaseId: number,
  occupantId: number,
  leftAt: string,
): Promise<Occupant> {
  const { data } = await apiClient.post<Occupant>(
    `/leases/${leaseId}/occupants/${occupantId}/depart`,
    { leftAt },
  )
  return data
}

/** Answers 400 when the person is not a current occupant of this lease. */
export async function transferPrimary(leaseId: number, customerId: number): Promise<Lease> {
  const { data } = await apiClient.post<Lease>(
    `/leases/${leaseId}/occupants/transfer-primary`,
    { customerId },
  )
  return data
}
