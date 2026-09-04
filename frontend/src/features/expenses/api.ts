import { apiClient } from '@/lib/api-client'
import type {
  Expense,
  ExpenseCategory,
  ListExpensesParams,
  Paginated,
  VacancyDue,
} from '@/features/expenses/types'

function toQuery(params: ListExpensesParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.roomId) query.roomId = params.roomId
  if (params.category) query.category = params.category
  if (params.from) query.from = params.from
  if (params.to) query.to = params.to
  return query
}

export async function listExpenses(params: ListExpensesParams): Promise<Paginated<Expense>> {
  const { data } = await apiClient.get<Paginated<Expense>>('/expenses', {
    params: toQuery(params),
  })
  return data
}

/**
 * Records a cost.
 *
 * Send EITHER a quantity and a rate OR an amount. When both parts of the basis
 * are supplied the API computes the amount from them, which is what stops a
 * stored figure disagreeing with the numbers it came from — an amount sent
 * alongside them is discarded, so the form never offers all three.
 */
export async function createExpense(input: {
  buildingId: number
  roomId?: number
  category: ExpenseCategory
  description: string
  incurredAt: string
  quantity?: number
  unitRate?: number
  amount?: number
}): Promise<Expense> {
  const { data } = await apiClient.post<Expense>('/expenses', input)
  return data
}

/** Permitted on a cost the SYSTEM recorded too — a mistyped reading has to be correctable. */
export async function updateExpense(
  id: number,
  input: { category?: ExpenseCategory; description?: string; incurredAt?: string; amount?: number },
): Promise<Expense> {
  const { data } = await apiClient.patch<Expense>(`/expenses/${id}`, input)
  return data
}

/** Removes it outright. Unlike a voided invoice, nothing is kept. */
export async function deleteExpense(id: number): Promise<void> {
  await apiClient.delete(`/expenses/${id}`)
}

/**
 * Which empty rooms still need their electricity recorded for a month.
 *
 * Not paginated: a worklist an owner walks down, and a second page of
 * outstanding rooms is a set of rooms that gets forgotten.
 */
export async function listVacancyDue(
  year: number,
  month: number,
  buildingId?: number,
): Promise<VacancyDue[]> {
  const { data } = await apiClient.get<{ data: VacancyDue[] }>(
    '/expenses/vacancy-electricity/due',
    { params: { year, month, ...(buildingId ? { buildingId } : {}) } },
  )
  return data.data
}

/**
 * Records one room's vacancy electricity.
 *
 * Answers 400 where a tenancy covered that month's end, where the room has no
 * known reading, or where the reading is below the one it opens from; 409 where
 * that room and month are already recorded.
 *
 * A meter that has not moved is a valid outcome with nothing to charge, and the
 * API answers 200 with no expense — not an error.
 */
export async function recordVacancy(input: {
  roomId: number
  year: number
  month: number
  currentReading: number
}): Promise<{ expense: Expense | null; consumedUnits: number }> {
  const { data } = await apiClient.post<{ expense: Expense | null; consumedUnits: number }>(
    '/expenses/vacancy-electricity',
    input,
  )
  return data
}
