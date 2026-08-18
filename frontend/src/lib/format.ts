/**
 * Display formatting.
 *
 * This is presentation, not transport. Monetary values arrive from the API as
 * numbers already (the backend serialises its Decimal columns that way), so
 * nothing here converts anything — it only renders a number for a human.
 *
 * ── Why there are two money formatters ──────────────────────────────────────
 *
 * Amounts and rates are stored at different precisions, and one rounding rule
 * cannot be right for both:
 *
 *     amounts   Decimal(14,0)   always whole      3.000.000 ₫
 *     rates     Decimal(12,4)   often fractional  3.500,5 ₫
 *
 * Rounding an amount is harmless because it has nothing to round. Rounding a
 * rate shows a figure the owner never entered — `formatMoney(3500.5)` renders
 * `3.501 ₫`, a different number, with nothing to signal it.
 *
 * The alternative was one function with an optional `decimals` argument. That
 * was rejected because its default would stay lossy: any call site that forgot
 * the argument would silently round a rate, which is the exact defect these two
 * names exist to prevent. Pick by name, not by remembering an option.
 */

const DONG = { style: 'currency', currency: 'VND' } as const

/**
 * Formats a whole-unit amount — an invoice total, a rent, an expense.
 *
 * Do not use for rates: see the note above.
 */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    ...DONG,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a rate or unit price, keeping any fractional part.
 *
 * A whole rate is shown without a fractional part rather than padded to
 * `3.500,0000` — the precision shown follows the value, not the column.
 */
export function formatRate(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    ...DONG,
    minimumFractionDigits: 0,
    // Matches the Decimal(12,4) the API records rates at, so no stored
    // precision is lost on the way to the screen.
    maximumFractionDigits: 4,
  }).format(value)
}
