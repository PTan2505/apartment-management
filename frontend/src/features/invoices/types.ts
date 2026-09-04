import type { PageMeta } from '@/components/Pagination'

/**
 * The kind of bill, which is decided by the operation that issued it and never
 * by a caller.
 *
 * Worth telling apart on screen: a move-in invoice charges a deposit and the
 * first month's rent, a monthly one settles a month's utilities and the NEXT
 * month's rent, a final one closes a tenancy, and an overdue one bills days
 * beyond the agreed term. A reader who cannot see which is which will read one
 * as another and conclude the figures are wrong.
 */
export type InvoiceType = 'moveIn' | 'monthly' | 'final' | 'overdue' | 'adhoc'

export type PaymentStatus = 'pending' | 'paid'

export type PaymentMethod = 'cash' | 'bank_transfer' | 'deposit_deduction' | 'gateway'

/**
 * A single charge, carrying what it was computed from.
 *
 * `quantity` and `unitAmount` are the basis — 50 kWh at 3.500, two occupants at
 * 100.000 — and are absent where there is none: an owner-named charge IS the
 * judgement, and a quantity of 1 beside it would read as information without
 * being any.
 */
export interface InvoiceLineItem {
  id: number
  kind: string
  description: string
  quantity: number | null
  unitAmount: number | null
  amount: number
  position: number
  /** The days this charge covers. Absent on a charge for an event. */
  periodStart: string | null
  periodEnd: string | null
  chargeCategory: string | null
}

/**
 * What settled an invoice, and when.
 *
 * An invoice may carry several over its life — taken, reversed, taken again —
 * so they are listed rather than summarised into the invoice itself.
 */
export interface Payment {
  id: number
  invoiceId: number
  amount: number
  method: PaymentMethod
  paidAt: string | null
  state: 'pending' | 'succeeded' | 'reversed' | 'failed' | 'expired' | 'cancelled'
  reversedAt: string | null
  reversalReason: string | null
}

export interface Invoice {
  id: number
  leaseId: number
  type: InvoiceType
  /** When the owner billed this, which is not the period it covers. */
  issueDate: string
  /** The month whose UTILITIES this covers. Absent on a bill that covers none. */
  year: number | null
  month: number | null
  periodStart: string | null
  periodEnd: string | null
  previousElectricityUse: number | null
  currentElectricityUse: number | null
  totalAmount: number
  paymentStatus: PaymentStatus
  /** Set once withdrawn. A voided bill is history, never money owed. */
  voidedAt: string | null
  /**
   * Why it was withdrawn.
   *
   * Null on a bill voided before reasons were recorded — which is a real state
   * and NOT a missing value to paper over: nobody knows why those were
   * withdrawn, and showing a substituted explanation would put a false
   * statement in front of a reader.
   */
  voidReason: string | null
  lineItems: InvoiceLineItem[]
  payments: Payment[]
}

/**
 * One tenancy still to be billed for a month.
 *
 * `previousElectricityUse` is the reading the invoice will ACTUALLY open from,
 * resolved by the server from the same rule that issues the bill. It is on the
 * row so the owner has something to check their typing against — a reading is
 * meaningless alone, since what gets billed is the difference.
 */
export interface DueForMonth {
  leaseId: number
  room: { id: number; roomCode: string }
  building: { id: number; displayName: string } | null
  tenant: { id: number; fullName: string; phone: string | null } | null
  baseRent: number
  occupantCount: number
  previousElectricityUse: number
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface ListInvoicesParams {
  page?: number
  pageSize?: number
  buildingId?: number
  roomId?: number
  leaseId?: number
  year?: number
  month?: number
  paymentStatus?: PaymentStatus
  /** Voided invoices are withheld unless asked for. */
  includeVoided?: boolean
}
