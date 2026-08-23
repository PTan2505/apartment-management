import type { PageMeta } from '@/components/Pagination'

/**
 * The room a tenancy is for, as the API reports it.
 *
 * Carries no rent. The lease has its own agreed rent — fixed when it was signed
 * and unaffected by later changes to the room — and that is the figure this
 * tenancy and its deposit are governed by. Two rents on one screen is how the
 * wrong one gets read.
 */
export interface LeaseRoom {
  id: number
  roomCode: string
  building: { id: number; displayName: string } | null
}

/** The person responsible for the agreement. Null is a state the API allows. */
export interface LeaseTenant {
  id: number
  fullName: string | null
  phone: string | null
}

export type LeaseStatus = 'active' | 'finalized'

export interface Lease {
  id: number
  roomId: number
  room: LeaseRoom | null
  startDate: string
  durationMonths: number
  /**
   * EXCLUSIVE: the first day the tenancy no longer covers.
   *
   * Never render this directly. `coveredThrough` in `dates.ts` turns it into
   * the last day actually covered, which is what a reader acts on.
   */
  expectedEndDate: string
  /** Exclusive in the same way as `expectedEndDate`. Null while running. */
  moveOutDate: string | null
  /**
   * How many people the room is billed for.
   *
   * Maintained by hand and NOT derived from the occupant records — the two may
   * legitimately differ, and the API refuses to reconcile them. See
   * `OccupantsCard` for how the pair is presented.
   */
  occupantCount: number
  baseRent: number
  depositMonths: number
  /** `baseRent × depositMonths` — what the terms agreed. */
  depositAmount: number
  /** What is actually held, which is a different question. */
  depositHeld: number
  status: LeaseStatus
  tenant: LeaseTenant | null
  createdAt: string
  updatedAt: string
}

export type OccupantStatus = 'current' | 'departed'

export interface Occupant {
  id: number
  customerId: number
  fullName: string | null
  phone: string | null
  isPrimary: boolean
  joinedAt: string
  leftAt: string | null
  status: OccupantStatus
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface ListLeasesParams {
  page?: number
  pageSize?: number
  roomId?: number
  /** Every tenancy in a building, without naming its rooms one at a time. */
  buildingId?: number
  customerId?: number
  /** Absent means both running and ended. */
  active?: boolean
  /** Term ended with no move-out recorded. */
  overdue?: boolean
}
