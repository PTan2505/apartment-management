import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as buildingsApi from '@/features/buildings/api'
import type { BuildingFormOutput } from '@/features/buildings/schema'
import type { ListBuildingsParams } from '@/features/buildings/types'

const BUILDINGS_KEY = ['buildings'] as const

/**
 * Params are part of the key, so changing a filter or page is a different query
 * rather than a refetch of the same one — React Query then keeps the previous
 * result cached and can serve it instantly on the way back.
 */
export function useBuildings(params: ListBuildingsParams) {
  return useQuery({
    queryKey: [...BUILDINGS_KEY, 'list', params],
    queryFn: () => buildingsApi.listBuildings(params),
  })
}

export function useBuildingLocations(includeInactive: boolean) {
  return useQuery({
    queryKey: [...BUILDINGS_KEY, 'locations', includeInactive],
    queryFn: () => buildingsApi.listBuildingLocations(includeInactive),
  })
}

/**
 * Every mutation invalidates the whole buildings key, which covers both the
 * lists and the locations.
 *
 * Locations matter as much as the list: creating a building in a new city, or
 * retiring the last one in a city, changes what the filters should offer.
 * Invalidating only the list would leave a filter offering a city with nothing
 * in it, or missing one that now has something.
 */
function useInvalidateBuildings() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: BUILDINGS_KEY })
}

export function useCreateBuilding() {
  const invalidate = useInvalidateBuildings()
  return useMutation({
    mutationFn: (input: BuildingFormOutput) => buildingsApi.createBuilding(input),
    onSuccess: invalidate,
  })
}

export function useUpdateBuilding() {
  const invalidate = useInvalidateBuildings()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: BuildingFormOutput }) =>
      buildingsApi.updateBuilding(id, input),
    onSuccess: invalidate,
  })
}

export function useRetireBuilding() {
  const invalidate = useInvalidateBuildings()
  return useMutation({
    mutationFn: (id: number) => buildingsApi.retireBuilding(id),
    onSuccess: invalidate,
  })
}

export function useRestoreBuilding() {
  const invalidate = useInvalidateBuildings()
  return useMutation({
    mutationFn: (id: number) => buildingsApi.restoreBuilding(id),
    onSuccess: invalidate,
  })
}
