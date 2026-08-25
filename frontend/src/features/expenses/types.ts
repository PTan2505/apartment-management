import type { PageMeta } from '@/components/Pagination'

/**
 * The kinds of cost. Mirrors the ad-hoc charge categories deliberately: what is
 * paid out as `repair` is what is charged back as `damage`, and an owner
 * comparing the two is asking whether they recovered what it cost.
 */
export type ExpenseCategory = 'vacancy_electricity' | 'cleaning' | 'repair' | 'other'

/**
 * Who recorded it.
 *
 * Both are equally correctable and not equally expected: an owner scanning
 * their spending needs to know an electricity cost they never typed came from a
 * room standing empty, rather than wondering who put it there.
 */
export type ExpenseOrigin = 'system' | 'manual'

export interface Expense {
  id: number
  buildingId: number
  roomId: number | null
  category: ExpenseCategory
  description: string
  incurredAt: string
  origin: ExpenseOrigin
  /** The basis, where the cost was measured. Null where it was simply a figure. */
  quantity: number | null
  unitRate: number | null
  amount: number
  /** Present only on vacancy electricity: which reconciliation produced it. */
  reconciliation: 'month_end' | 'lease_start' | null
  year: number | null
  month: number | null
  previousReading: number | null
  currentReading: number | null
}

/**
 * One room still needing its vacancy electricity recorded for a month.
 *
 * `previousReading` is never null here: a room with no known reading is
 * excluded outright, because consumption is a difference and the API refuses to
 * record one with nothing to subtract from.
 */
export interface VacancyDue {
  roomId: number
  roomCode: string
  building: { id: number; displayName: string } | null
  electricityRate: number
  previousReading: number
  previousReadingAt: string
  previousReadingSource: 'lease_start' | 'lease_end' | 'vacancy'
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface ListExpensesParams {
  page?: number
  pageSize?: number
  buildingId?: number
  roomId?: number
  category?: ExpenseCategory
  from?: string
  to?: string
}
