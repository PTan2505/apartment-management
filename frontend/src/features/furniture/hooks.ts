import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as furnitureApi from '@/features/furniture/api'
import type {
  AddRoomFurnitureInput,
  FurnitureItemInput,
  RoomFurniture,
} from '@/features/furniture/types'

const KEY = ['furniture'] as const

/* ---------------- the building's catalogue ---------------- */

export function useFurnitureCatalogue(buildingId: number, includeInactive = false) {
  return useQuery({
    queryKey: [...KEY, 'catalogue', buildingId, includeInactive],
    queryFn: () => furnitureApi.listFurnitureItems(buildingId, includeInactive),
  })
}

function useInvalidateCatalogue(buildingId: number) {
  const queryClient = useQueryClient()
  return () =>
    queryClient.invalidateQueries({ queryKey: [...KEY, 'catalogue', buildingId] })
}

export function useCreateFurnitureItem(buildingId: number) {
  const invalidate = useInvalidateCatalogue(buildingId)
  return useMutation({
    mutationFn: (input: FurnitureItemInput) =>
      furnitureApi.createFurnitureItem(buildingId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateFurnitureItem(buildingId: number) {
  const invalidate = useInvalidateCatalogue(buildingId)
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<FurnitureItemInput> }) =>
      furnitureApi.updateFurnitureItem(buildingId, id, input),
    onSuccess: invalidate,
  })
}

export function useRetireFurnitureItem(buildingId: number) {
  const invalidate = useInvalidateCatalogue(buildingId)
  return useMutation({
    mutationFn: (id: number) => furnitureApi.retireFurnitureItem(buildingId, id),
    onSuccess: invalidate,
  })
}

export function useRestoreFurnitureItem(buildingId: number) {
  const invalidate = useInvalidateCatalogue(buildingId)
  return useMutation({
    mutationFn: (id: number) => furnitureApi.restoreFurnitureItem(buildingId, id),
    onSuccess: invalidate,
  })
}

/* ---------------- what a room holds ---------------- */

export function useRoomFurniture(roomId: number) {
  return useQuery({
    queryKey: [...KEY, 'room', roomId],
    queryFn: () => furnitureApi.listRoomFurniture(roomId),
  })
}

/**
 * Invalidates the room's holdings, and nothing else.
 *
 * Deliberately NOT any tenancy's hand-over record: that record is frozen, and
 * refetching it here would suggest to the next reader that changing a room can
 * move it. It cannot.
 */
function useInvalidateRoom(roomId: number) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: [...KEY, 'room', roomId] })
}

export function useAddRoomFurniture(roomId: number) {
  const invalidate = useInvalidateRoom(roomId)
  return useMutation({
    mutationFn: (input: AddRoomFurnitureInput) => furnitureApi.addRoomFurniture(roomId, input),
    onSuccess: invalidate,
  })
}

export function useUpdateRoomFurniture(roomId: number) {
  const invalidate = useInvalidateRoom(roomId)
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: Partial<Pick<RoomFurniture, 'quantity' | 'condition'>> & { note?: string | null }
    }) => furnitureApi.updateRoomFurniture(roomId, id, input),
    onSuccess: invalidate,
  })
}

export function useRemoveRoomFurniture(roomId: number) {
  const invalidate = useInvalidateRoom(roomId)
  return useMutation({
    mutationFn: (id: number) => furnitureApi.removeRoomFurniture(roomId, id),
    onSuccess: invalidate,
  })
}

/* ---------------- the frozen hand-over record ---------------- */

export function useLeaseFurniture(leaseId: number) {
  return useQuery({
    queryKey: [...KEY, 'lease', leaseId],
    queryFn: () => furnitureApi.listLeaseFurniture(leaseId),
  })
}
