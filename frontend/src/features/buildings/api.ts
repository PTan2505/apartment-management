import type { ActiveStatus } from '@/lib/active-status'
import { apiClient } from '@/lib/api-client'
import type {
  Building,
  BuildingLocation,
  BuildingServiceFee,
  ServiceFeeBasis,
  ListBuildingsParams,
  Paginated,
} from '@/features/buildings/types'
import type { BuildingFormOutput } from '@/features/buildings/schema'

/**
 * `status` is omitted when it is the API's own default ("active"), so that
 * value is not written into every URL.
 */
function toQuery(params: ListBuildingsParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.city) query.city = params.city
  if (params.ward) query.ward = params.ward
  if (params.status && params.status !== 'active') query.status = params.status
  return query
}

export async function listBuildings(
  params: ListBuildingsParams,
): Promise<Paginated<Building>> {
  const { data } = await apiClient.get<Paginated<Building>>('/buildings', {
    params: toQuery(params),
  })
  return data
}

/**
 * The ward and city values buildings actually record, grouped by city.
 *
 * Takes the same `status` as the listing on purpose: offering a location whose
 * only buildings are filtered out would guarantee an empty result.
 */
export async function listBuildingLocations(
  status: ActiveStatus,
): Promise<BuildingLocation[]> {
  const { data } = await apiClient.get<{ locations: BuildingLocation[] }>(
    '/buildings/locations',
    { params: status === 'active' ? {} : { status } },
  )
  return data.locations
}

/**
 * Create and update differ on how "no place" is expressed, and the difference
 * is meaningful rather than an inconsistency.
 *
 * Creating: there is nothing to clear, so an absent place is simply omitted.
 * The API accepts the field as optional and rejects an explicit null.
 *
 * Updating: null is a value — it clears a place recorded earlier, which is what
 * correcting an address by hand has to do.
 */
export async function getBuilding(id: number): Promise<Building> {
  const { data } = await apiClient.get<Building>(`/buildings/${id}`)
  return data
}

export async function createBuilding(input: BuildingFormOutput): Promise<Building> {
  const { placeId, ...rest } = input
  const body = placeId ? { ...rest, placeId } : rest
  const { data } = await apiClient.post<Building>('/buildings', body)
  return data
}

export async function updateBuilding(
  id: number,
  input: BuildingFormOutput,
): Promise<Building> {
  const { data } = await apiClient.patch<Building>(`/buildings/${id}`, input)
  return data
}

/** Answers 409 when one of the building's rooms still has an active lease. */
export async function retireBuilding(id: number): Promise<Building> {
  const { data } = await apiClient.post<Building>(`/buildings/${id}/retire`)
  return data
}

export async function restoreBuilding(id: number): Promise<Building> {
  const { data } = await apiClient.post<Building>(`/buildings/${id}/restore`)
  return data
}

// ── The building's service-fee catalogue ────────────────────────────────────
//
// What the building charges for beside rent: rubbish, internet, a parking
// space. Moved here from the tenancy module, which owned it only because the
// move-out dialog was the first screen that needed to read it — the catalogue
// is the OWNER's setting on a building, and now has a screen that says so.

/**
 * PAGINATED, like every other listing in this API — typing it as a bare array
 * is what once crashed the move-out dialog: `.filter` on a `{ data, meta }`
 * object took the whole page down. Unwrapped here so no caller can repeat it.
 *
 * `includeInactive` is for the screen that MANAGES the catalogue, which has to
 * show a retired fee in order to offer it back. Everywhere a fee is CHOSEN,
 * leave it off: a retired fee is one the API refuses to attach.
 */
export async function listBuildingServiceFees(
  buildingId: number,
  includeInactive = false,
): Promise<BuildingServiceFee[]> {
  const { data } = await apiClient.get<Paginated<BuildingServiceFee>>(
    `/buildings/${buildingId}/service-fees`,
    { params: { pageSize: 200, ...(includeInactive ? { includeInactive: 'true' } : {}) } },
  )
  return data.data
}

export interface ServiceFeeInput {
  name: string
  unitAmount: number
  basis: ServiceFeeBasis
  appliedByDefault: boolean
}

export async function createServiceFee(
  buildingId: number,
  input: ServiceFeeInput,
): Promise<BuildingServiceFee> {
  const { data } = await apiClient.post<BuildingServiceFee>(
    `/buildings/${buildingId}/service-fees`,
    input,
  )
  return data
}

export async function updateServiceFee(
  buildingId: number,
  feeId: number,
  input: ServiceFeeInput,
): Promise<BuildingServiceFee> {
  const { data } = await apiClient.patch<BuildingServiceFee>(
    `/buildings/${buildingId}/service-fees/${feeId}`,
    input,
  )
  return data
}

export async function retireServiceFee(
  buildingId: number,
  feeId: number,
): Promise<BuildingServiceFee> {
  const { data } = await apiClient.post<BuildingServiceFee>(
    `/buildings/${buildingId}/service-fees/${feeId}/retire`,
  )
  return data
}

export async function restoreServiceFee(
  buildingId: number,
  feeId: number,
): Promise<BuildingServiceFee> {
  const { data } = await apiClient.post<BuildingServiceFee>(
    `/buildings/${buildingId}/service-fees/${feeId}/restore`,
  )
  return data
}
