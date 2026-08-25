import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as invoicesApi from '@/features/invoices/api'
import type { ListInvoicesParams, PaymentMethod } from '@/features/invoices/types'

const INVOICES_KEY = ['invoices'] as const
const LEASES_KEY = ['leases'] as const

/**
 * `enabled` exists for callers that must ask this question conditionally.
 * Hooks cannot be called conditionally, so the condition has to live in the
 * query rather than around the call.
 */
export function useInvoices(params: ListInvoicesParams, enabled = true) {
  return useQuery({
    queryKey: [...INVOICES_KEY, 'list', params],
    queryFn: () => invoicesApi.listInvoices(params),
    enabled,
  })
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [...INVOICES_KEY, 'detail', id],
    queryFn: () => invoicesApi.getInvoice(id),
  })
}

/** What is still to be billed for a month, in the building being worked through. */
export function useDueForMonth(year: number, month: number, buildingId?: number) {
  return useQuery({
    queryKey: [...INVOICES_KEY, 'due', year, month, buildingId],
    queryFn: () => invoicesApi.listDue(year, month, buildingId),
  })
}

/**
 * Refreshes invoices AND leases.
 *
 * Settling a bill from the deposit moves the holding, which the tenancy screen
 * reports. Leaving leases stale would show an owner a deposit they have already
 * spent, and the next attempt to spend it would be refused for a reason the
 * screen had been told and thrown away.
 */
function useInvalidateInvoices() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: INVOICES_KEY })
    void queryClient.invalidateQueries({ queryKey: LEASES_KEY })
  }
}

/**
 * Issues one invoice.
 *
 * Deliberately one per call rather than a batch. Twenty invoices in one
 * transaction fail as a unit: a single bad reading rolls back nineteen correct
 * bills, and the owner has to work out which row was at fault from one error.
 * Per row, the failure belongs to the row that caused it and the rest stand.
 */
export function useGenerateInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: invoicesApi.generateInvoice,
    onSuccess: invalidate,
  })
}

/**
 * Withdrawing a bill puts its tenancy back on that month's billing list, so
 * this has to refresh invoices — the `due` queries live under the same key, and
 * a stale one would leave the room missing from the list the owner is about to
 * be sent to.
 */
export function useVoidInvoice() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      invoicesApi.voidInvoice(id, reason),
    onSuccess: invalidate,
  })
}

export function useMarkPaid() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: ({
      id,
      paymentMethod,
      paidAt,
    }: {
      id: number
      paymentMethod: PaymentMethod
      paidAt: string
    }) => invoicesApi.markPaid(id, { paymentMethod, paidAt }),
    onSuccess: invalidate,
  })
}

export function useReversePayment() {
  const invalidate = useInvalidateInvoices()
  return useMutation({
    mutationFn: ({ paymentId, reversedAt }: { paymentId: number; reversedAt: string }) =>
      invoicesApi.reversePayment(paymentId, reversedAt),
    onSuccess: invalidate,
  })
}
