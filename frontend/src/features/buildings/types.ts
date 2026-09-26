import type { ActiveStatus } from '@/lib/active-status'
import type { PageMeta } from '@/components/Pagination'

/**
 * Money is `number`, not `string`: the backend serialises its Decimal columns
 * as JSON numbers (see api-money-as-numbers), so nothing converts here.
 *
 * `electricityRate` and `waterRatePerPerson` can be fractional; `formatMoney`
 * shows a value's own precision, so nothing is rounded away.
 */
export interface Building {
  id: number
  displayName: string
  /** The street line only. Ward, city and country are held separately. */
  address: string
  ward: string
  city: string
  country: string
  /** The place the address was resolved from; null when typed by hand. */
  placeId: string | null
  electricityRate: number
  waterRatePerPerson: number
  /**
   * Months of rent a tenancy signed here takes as a deposit, unless the owner
   * says otherwise for that tenancy. A whole number; zero for a building that
   * takes no deposit.
   */
  defaultDepositMonths: number
  /**
   * How full the building is, counted by the API over its rooms IN SERVICE: a
   * room is let while a tenancy holds it, and the two always sum to the rooms
   * in service. A retired room is in neither.
   */
  roomsLet: number
  roomsEmpty: number
  /** Rooms taken out of service. In neither figure above. */
  roomsRetired: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

/** One city with the wards recorded for buildings in it. */
export interface BuildingLocation {
  city: string
  wards: string[]
}

export interface ListBuildingsParams {
  page?: number
  pageSize?: number
  city?: string
  ward?: string
  status?: ActiveStatus
}

export type ServiceFeeBasis = 'perRoom' | 'perPerson'

/**
 * One thing a building charges for beside rent, rates and deposit — rubbish,
 * internet, a parking space.
 *
 * Lives here rather than with tenancies: the catalogue belongs to the BUILDING
 * and the owner sets it there. A tenancy only picks from it, and takes its own
 * copy of the price when it does, so repricing here never moves a bill already
 * agreed.
 */
export interface BuildingServiceFee {
  id: number
  buildingId: number
  name: string
  /** Per month, per unit. What multiplies it depends on `basis`. */
  unitAmount: number
  /**
   * What the amount is multiplied by: the quantity a tenancy holds
   * (`perRoom`), or the tenancy's occupant count read at billing time
   * (`perPerson`) — the same number the water charge already uses.
   */
  basis: ServiceFeeBasis
  /** Whether a tenancy signed here takes it up on its own. Never retroactive. */
  appliedByDefault: boolean
  /** A retired fee cannot be added to a new tenancy; existing ones keep it. */
  isActive: boolean
}
