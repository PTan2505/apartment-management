import type { PageMeta } from '@/components/Pagination'

/**
 * Money is `number`, not `string`: the backend serialises its Decimal columns
 * as JSON numbers (see api-money-as-numbers), so nothing converts here.
 *
 * `electricityRate` and `waterRatePerPerson` are rates and can be fractional —
 * display them with `formatRate`, not `formatMoney`.
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
  includeInactive?: boolean
}
