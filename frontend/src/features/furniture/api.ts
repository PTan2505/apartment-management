import { apiClient } from '@/lib/api-client'
import type {
  AddRoomFurnitureInput,
  FurnitureItem,
  FurnitureItemInput,
  LeaseFurnitureList,
  RoomFurniture,
  RoomFurnitureList,
} from '@/features/furniture/types'
import type { Paginated } from '@/features/customers/types'

/* ---------------- the building's catalogue ---------------- */

export async function listFurnitureItems(
  buildingId: number,
  includeInactive = false,
): Promise<Paginated<FurnitureItem>> {
  const { data } = await apiClient.get<Paginated<FurnitureItem>>(
    `/buildings/${buildingId}/furniture`,
    { params: { pageSize: 200, ...(includeInactive ? { includeInactive: true } : {}) } },
  )
  return data
}

export async function createFurnitureItem(
  buildingId: number,
  input: FurnitureItemInput,
): Promise<FurnitureItem> {
  const { data } = await apiClient.post<FurnitureItem>(`/buildings/${buildingId}/furniture`, input)
  return data
}

export async function updateFurnitureItem(
  buildingId: number,
  itemId: number,
  input: Partial<FurnitureItemInput>,
): Promise<FurnitureItem> {
  const { data } = await apiClient.patch<FurnitureItem>(
    `/buildings/${buildingId}/furniture/${itemId}`,
    input,
  )
  return data
}

export async function retireFurnitureItem(buildingId: number, itemId: number) {
  const { data } = await apiClient.post<FurnitureItem>(
    `/buildings/${buildingId}/furniture/${itemId}/retire`,
  )
  return data
}

export async function restoreFurnitureItem(buildingId: number, itemId: number) {
  const { data } = await apiClient.post<FurnitureItem>(
    `/buildings/${buildingId}/furniture/${itemId}/restore`,
  )
  return data
}

/* ---------------- what a room holds ---------------- */

export async function listRoomFurniture(roomId: number): Promise<RoomFurnitureList> {
  const { data } = await apiClient.get<RoomFurnitureList>(`/rooms/${roomId}/furniture`)
  return data
}

export async function addRoomFurniture(
  roomId: number,
  input: AddRoomFurnitureInput,
): Promise<RoomFurniture> {
  const { data } = await apiClient.post<RoomFurniture>(`/rooms/${roomId}/furniture`, input)
  return data
}

export async function updateRoomFurniture(
  roomId: number,
  holdingId: number,
  input: Partial<Pick<RoomFurniture, 'quantity' | 'condition'>> & { note?: string | null },
): Promise<RoomFurniture> {
  const { data } = await apiClient.patch<RoomFurniture>(
    `/rooms/${roomId}/furniture/${holdingId}`,
    input,
  )
  return data
}

export async function removeRoomFurniture(roomId: number, holdingId: number) {
  const { data } = await apiClient.delete<{ removed: true }>(
    `/rooms/${roomId}/furniture/${holdingId}`,
  )
  return data
}

/* ---------------- the frozen hand-over record ---------------- */

/** Read only. There is deliberately no sibling that writes — see the service. */
export async function listLeaseFurniture(leaseId: number): Promise<LeaseFurnitureList> {
  const { data } = await apiClient.get<LeaseFurnitureList>(`/leases/${leaseId}/furniture`)
  return data
}
