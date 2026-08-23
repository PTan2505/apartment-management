import type { PageMeta } from '@/components/Pagination'

/**
 * A room carries the building it belongs to, not just its id.
 *
 * A room code identifies a room only within its building — the same code may
 * exist in several, and a code search deliberately returns one entry per
 * matching building. A room shown without its building is ambiguous.
 */
export interface RoomBuilding {
  id: number
  displayName: string
}

export interface Room {
  id: number
  buildingId: number
  building: RoomBuilding
  roomCode: string
  /** Recorded to two decimal places, so it can be fractional. */
  baseRent: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface ListRoomsParams {
  page?: number
  pageSize?: number
  buildingId?: number
  search?: string
  includeInactive?: boolean
}
