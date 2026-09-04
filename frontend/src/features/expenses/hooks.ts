import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as expensesApi from '@/features/expenses/api'
import type { ExpenseCategory, ListExpensesParams } from '@/features/expenses/types'

const EXPENSES_KEY = ['expenses'] as const

export function useExpenses(params: ListExpensesParams) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, 'list', params],
    queryFn: () => expensesApi.listExpenses(params),
  })
}

export function useVacancyDue(year: number, month: number, buildingId?: number) {
  return useQuery({
    queryKey: [...EXPENSES_KEY, 'vacancy-due', year, month, buildingId],
    queryFn: () => expensesApi.listVacancyDue(year, month, buildingId),
  })
}

/**
 * Every mutation here refreshes the whole feature, including the outstanding
 * list — recording a room's electricity is what takes it off that list, and a
 * stale copy would keep offering work already done.
 */
function useInvalidateExpenses() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: EXPENSES_KEY })
  }
}

export function useCreateExpense() {
  const invalidate = useInvalidateExpenses()
  return useMutation({ mutationFn: expensesApi.createExpense, onSuccess: invalidate })
}

export function useUpdateExpense() {
  const invalidate = useInvalidateExpenses()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: {
        category?: ExpenseCategory
        description?: string
        incurredAt?: string
        amount?: number
      }
    }) => expensesApi.updateExpense(id, input),
    onSuccess: invalidate,
  })
}

export function useDeleteExpense() {
  const invalidate = useInvalidateExpenses()
  return useMutation({ mutationFn: expensesApi.deleteExpense, onSuccess: invalidate })
}

/**
 * One room at a time, deliberately — the same decision the billing round made
 * and for the same reason: one bad reading among twenty must not roll back
 * nineteen correct records, and a failure has to belong to the row that caused
 * it.
 */
export function useRecordVacancy() {
  const invalidate = useInvalidateExpenses()
  return useMutation({ mutationFn: expensesApi.recordVacancy, onSuccess: invalidate })
}
