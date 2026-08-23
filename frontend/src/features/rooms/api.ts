import { apiClient } from '@/lib/api-client'
import type { ListRoomsParams, Paginated, Room } from '@/features/rooms/types'
import type { CreateRoomFormOutput, UpdateRoomFormOutput } from '@/features/rooms/schema'

function toQuery(params: ListRoomsParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.search) query.search = params.search
  // Absent means "in service only" to the API, so "false" would be noise.
  if (params.includeInactive) query.includeInactive = 'true'
  return query
}

export async function listRooms(params: ListRoomsParams): Promise<Paginated<Room>> {
  const { data } = await apiClient.get<Paginated<Room>>('/rooms', { params: toQuery(params) })
  return data
}

export async function createRoom(input: CreateRoomFormOutput): Promise<Room> {
  const { data } = await apiClient.post<Room>('/rooms', input)
  return data
}

export async function updateRoom(id: number, input: UpdateRoomFormOutput): Promise<Room> {
  const { data } = await apiClient.patch<Room>(`/rooms/${id}`, input)
  return data
}

/** Answers 409 when the room still has an active lease. */
export async function retireRoom(id: number): Promise<Room> {
  const { data } = await apiClient.post<Room>(`/rooms/${id}/retire`)
  return data
}

/** Answers 409 when another room in service has since taken this code. */
export async function restoreRoom(id: number): Promise<Room> {
  const { data } = await apiClient.post<Room>(`/rooms/${id}/restore`)
  return data
}
