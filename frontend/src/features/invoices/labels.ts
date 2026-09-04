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
  moveIn: 'Nhận phòng',
  monthly: 'Hàng tháng',
  final: 'Kết thúc',
  overdue: 'Quá hạn',
  adhoc: 'Phát sinh',
}

const INVOICE_TYPE_EXPLANATIONS: Record<InvoiceType, string> = {
  moveIn: 'Tiền cọc và tiền nhà tháng đầu, thu khi bắt đầu hợp đồng.',
  monthly:
    'Điện nước của tháng này cộng tiền nhà của THÁNG SAU — vì vậy trên hoá đơn có hai tháng khác nhau.',
  final: 'Điện nước lần cuối của hợp đồng, tính đến ngày khách trả phòng.',
  overdue: 'Khoản thu cho những ngày ở quá hạn thoả thuận, do chủ quyết định.',
  adhoc: 'Khoản chủ tự đặt chứ không tính ra — hư hỏng, mất chìa, phạt.',
}

export function invoiceTypeLabel(type: InvoiceType): string {
  return INVOICE_TYPE_LABELS[type] ?? type
}

export function invoiceTypeExplanation(type: InvoiceType): string {
  return INVOICE_TYPE_EXPLANATIONS[type] ?? ''
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  // Not "deduction": the money genuinely reached the owner months ago, and
  // what happened here is that it stopped being the tenant's.
  deposit_deduction: 'Trừ vào tiền cọc',
  gateway: 'Thanh toán online',
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[method] ?? method
}

/**
 * `2026-06` as a Vietnamese reader says it: "Tháng 6/2026".
 *
 * Written out rather than taken from `toLocaleDateString('vi-VN')`, which
 * renders "tháng 6 năm 2026" — correct, and long enough to wrap in a table cell
 * and a dropdown, both of which show a month on every row.
 */
export function monthLabel(year: number | null, month: number | null): string {
  if (year === null || month === null) return '—'
  return `Tháng ${month}/${year}`
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
