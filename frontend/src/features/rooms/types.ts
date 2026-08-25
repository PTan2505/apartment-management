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
  /**
   * Where the meter stood when the room was added, or null where nobody said.
   *
   * Null and 0 are different facts — the second is a statement that the meter
   * reads zero — and the distinction is what keeps a room brought in from an
   * existing building from being charged its meter's whole history.
   */
  initialMeterReading: number | null
  isActive: boolean
  /**
   * Whether a tenancy is currently running here.
   *
   * Reported by the API rather than worked out from the leases, so the answer
   * is a fact about the room instead of something every caller reconstructs
   * differently. A tenancy past its agreed term with no move-out still counts:
   * it has not been closed, and the room is not free to let again.
   *
   * Says only whether, never to whom — the tenancy's own details belong to the
   * tenancy.
   */
  isLet: boolean
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
  /** Only rooms with no running tenancy — the ones that can be let. */
  vacant?: boolean
}

/**
 * Where a room's meter stands, as far as the system knows.
 *
 * `reading` is null for a room never let and with no recorded vacancy: there is
 * genuinely nothing to fall back on, and a lease starting there must be given a
 * reading rather than assuming one.
 */
export interface RoomMeterReading {
  reading: number | null
  /** When that reading was taken. */
  at: string | null
  source: 'lease_start' | 'lease_end' | 'vacancy' | null
}
