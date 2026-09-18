import type { ActiveStatus } from '@/lib/active-status'
import { apiClient } from '@/lib/api-client'
import type {
  Building,
  BuildingLocation,
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
