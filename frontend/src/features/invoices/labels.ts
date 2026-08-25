import type { InvoiceType, PaymentMethod } from '@/features/invoices/types'

/**
 * What each kind of bill is, in the words an owner would use.
 *
 * Named rather than left as the API's identifier because the kinds answer
 * genuinely different questions, and a reader who cannot tell them apart will
 * read one as another and conclude the figures are wrong — most often the
 * move-in invoice, whose total is large because most of it is a deposit rather
 * than money earned.
 */
const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  moveIn: 'Move-in',
  monthly: 'Monthly',
  final: 'Final',
  overdue: 'Overdue',
  adhoc: 'Charges',
}

const INVOICE_TYPE_EXPLANATIONS: Record<InvoiceType, string> = {
  moveIn: 'The deposit and the first month’s rent, charged when the tenancy began.',
  monthly:
    'A month’s utilities together with the FOLLOWING month’s rent, which is why two months are named on it.',
  final: 'The closing utilities of a tenancy, up to the day the tenant left.',
  overdue: 'Charges for days stayed beyond the agreed term, decided by the owner.',
  adhoc: 'Charges the owner decided rather than calculated — damage, a lost key, a penalty.',
}

export function invoiceTypeLabel(type: InvoiceType): string {
  return INVOICE_TYPE_LABELS[type] ?? type
}

export function invoiceTypeExplanation(type: InvoiceType): string {
  return INVOICE_TYPE_EXPLANATIONS[type] ?? ''
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  // Not "deduction": the money genuinely reached the owner months ago, and
  // what happened here is that it stopped being the tenant's.
  deposit_deduction: 'From the deposit held',
  gateway: 'Online payment',
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

/** `2026-06` as a person reads it. */
export function monthLabel(year: number | null, month: number | null): string {
  if (year === null || month === null) return '—'
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** The twelve months of a year, most recent first — billing looks backwards. */
export function recentMonths(count = 18): { year: number; month: number }[] {
  const now = new Date()
  const months: { year: number; month: number }[] = []
  let year = now.getUTCFullYear()
  let month = now.getUTCMonth() + 1

  for (let i = 0; i < count; i += 1) {
    months.push({ year, month })
    month -= 1
    if (month === 0) {
      month = 12
      year -= 1
    }
  }
  return months
}
