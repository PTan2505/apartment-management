import { apiClient } from '@/lib/api-client'
import { storageFetch } from '@/lib/storage-fetch'
import type {
  ListRoomsParams,
  Paginated,
  Room,
  RoomMeterReading,
  RoomPhoto,
} from '@/features/rooms/types'
import type { CreateRoomFormOutput, UpdateRoomFormOutput } from '@/features/rooms/schema'

function toQuery(params: ListRoomsParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.search) query.search = params.search
  // Absent means "in service only" to the API, so that value stays out of the URL.
  if (params.status && params.status !== 'active') query.status = params.status
  // Likewise: absent means every room, let or not.
  if (params.vacant) query.vacant = 'true'
  // "all" is the API's own default, so it stays out of the URL.
  if (params.occupancy && params.occupancy !== 'all') query.occupancy = params.occupancy
  if (params.availableOn) query.availableOn = params.availableOn
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

/** Asked for one room at a time — see the note on the endpoint. */
/** One room, for a screen that needs what it asks TODAY rather than what a tenancy agreed. */
export async function getRoom(id: number): Promise<Room> {
  const { data } = await apiClient.get<Room>(`/rooms/${id}`)
  return data
}

export async function getRoomMeterReading(id: number): Promise<RoomMeterReading> {
  const { data } = await apiClient.get<RoomMeterReading>(`/rooms/${id}/latest-meter-reading`)
  return data
}

// ── Photographs ────────────────────────────────────────────────────────────
//
// The same three steps as a contract page and a damage-report photograph: the
// API signs, the BROWSER sends the bytes to storage, the API confirms. A
// megabyte of image never passes through the API process.

export const ROOM_PHOTO_ACCEPT = 'image/jpeg,image/png,image/heic'

export interface SignedUpload {
  url: string
  key: string
  expiresAt: string
  maxBytes: number
}

export async function listRoomPhotos(roomId: number): Promise<RoomPhoto[]> {
  const { data } = await apiClient.get<{ photos: RoomPhoto[] }>(`/rooms/${roomId}/photos`)
  return data.photos
}

export async function roomPhotoDownload(roomId: number, photoId: number): Promise<{ url: string }> {
  const { data } = await apiClient.get<{ url: string }>(
    `/rooms/${roomId}/photos/${photoId}/download`,
  )
  return data
}

export async function removeRoomPhoto(roomId: number, photoId: number): Promise<RoomPhoto[]> {
  const { data } = await apiClient.delete<{ photos: RoomPhoto[] }>(
    `/rooms/${roomId}/photos/${photoId}`,
  )
  return data.photos
}

/**
 * Uploads one photograph, and says whether it worked.
 *
 * Never throws. Several files are attached one at a time, and one rejection
 * must not lose the others — the caller reports which failed rather than
 * abandoning the batch.
 */
export async function attachRoomPhoto(roomId: number, file: File): Promise<boolean> {
  try {
    const { data: signed } = await apiClient.post<SignedUpload>(
      `/rooms/${roomId}/photos/upload-url`,
      { contentType: file.type },
    )
    // Checked here as well as at confirmation: a 10 MB upload that will be
    // refused afterwards is a 10 MB upload nobody needed to make.
    if (file.size > signed.maxBytes) return false

    const response = await storageFetch(signed.url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!response.ok) return false

    await apiClient.post(`/rooms/${roomId}/photos`, { key: signed.key })
    return true
  } catch {
    return false
  }
}
