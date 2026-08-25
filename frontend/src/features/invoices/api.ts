import { apiClient } from '@/lib/api-client'
import type {
  DueForMonth,
  Invoice,
  ListInvoicesParams,
  Paginated,
  PaymentMethod,
} from '@/features/invoices/types'

function toQuery(params: ListInvoicesParams): Record<string, string | number> {
  const query: Record<string, string | number> = {}
  if (params.page && params.page > 1) query.page = params.page
  if (params.pageSize) query.pageSize = params.pageSize
  if (params.buildingId) query.buildingId = params.buildingId
  if (params.roomId) query.roomId = params.roomId
  if (params.leaseId) query.leaseId = params.leaseId
  if (params.year) query.year = params.year
  if (params.month) query.month = params.month
  if (params.paymentStatus) query.paymentStatus = params.paymentStatus
  // Voided bills are a record of what was withdrawn, not money anybody owes.
  // Only a decided value is sent, so the API's default keeps them out.
  if (params.includeVoided) query.includeVoided = 'true'
  return query
}

export async function listInvoices(params: ListInvoicesParams): Promise<Paginated<Invoice>> {
  const { data } = await apiClient.get<Paginated<Invoice>>('/invoices', {
    params: toQuery(params),
  })
  return data
}

export async function getInvoice(id: number): Promise<Invoice> {
  const { data } = await apiClient.get<Invoice>(`/invoices/${id}`)
  return data
}

/**
 * What is still to be billed for a month.
 *
 * Not paginated: this is a worklist rather than a page of records, and a second
 * page of outstanding rooms is a set of rooms that gets forgotten.
 */
export async function listDue(
  year: number,
  month: number,
  buildingId?: number,
): Promise<DueForMonth[]> {
  const { data } = await apiClient.get<{ data: DueForMonth[] }>('/invoices/due', {
    params: { year, month, ...(buildingId ? { buildingId } : {}) },
  })
  return data.data
}

/**
 * Issues one monthly invoice.
 *
 * Answers 400 for a reading below the one the tenancy opens from, or a month
 * the tenancy did not occupy; 409 where an invoice for that month already
 * exists — which is what a second owner, or a second tab, runs into.
 */
export async function generateInvoice(input: {
  leaseId: number
  year: number
  month: number
  currentElectricityUse: number
}): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>('/invoices', input)
  return data
}

/** Answers 400 when settling from a deposit larger than the holding covers. */
export async function markPaid(
  id: number,
  input: { paymentMethod: PaymentMethod; paidAt: string },
): Promise<Invoice> {
  const { data } = await apiClient.post<Invoice>(`/invoices/${id}/pay`, input)
  return data
}

/**
 * Undoes a payment, returning the invoice to unpaid where nothing else is
 * settling it. Answers 409 on a payment already reversed.
 */
export async function reversePayment(
  paymentId: number,
  reversedAt: string,
): Promise<unknown> {
  const { data } = await apiClient.post(`/payments/${paymentId}/reverse`, { reversedAt })
  return data
}
