import type { Invoice } from '@/features/invoices/types'

/**
 * Whether a bill is still money owed.
 *
 * Written once, because two screens state it about the same tenancy: the
 * invoice panel's "Dư nợ" and the warning shown before a tenancy is ended,
 * renewed or cancelled. Two copies of this rule would eventually disagree, and
 * an owner reading one figure in the panel and another in the dialog cannot
 * tell which is wrong.
 *
 * A withdrawn bill is history, never money owed — it was withdrawn on purpose.
 */
export function isOwed(invoice: Pick<Invoice, 'voidedAt' | 'paymentStatus'>): boolean {
  return invoice.voidedAt === null && invoice.paymentStatus !== 'paid'
}
