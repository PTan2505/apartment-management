/**
 * Display formatting.
 *
 * This is presentation, not transport. Monetary values arrive from the API as
 * numbers already (the backend serialises its Decimal columns that way), so
 * nothing here converts anything — it only renders a number for a human.
 *
 * ── Why there is one money formatter and not two ────────────────────────────
 *
 * There were briefly two, split on the theory that amounts are whole and rates
 * fractional. Measured against every value this system stores, the two agree
 * everywhere except where the amount formatter rounds — and every one of those
 * cases is wrong:
 *
 *     3.000.000    →  3.000.000 ₫    3.000.000 ₫     same
 *     25.000       →  25.000 ₫       25.000 ₫        same
 *     3500,5       →  3.501 ₫        3.500,5 ₫       one of these is wrong
 *     3.000.000,5  →  3.000.001 ₫    3.000.000,5 ₫   one of these is wrong
 *
 * Rent settled it: `baseRent` is stored to two decimal places, so it is neither
 * an amount nor a rate under that split. The distinction does not exist. What
 * does exist is a value's own precision, and showing it is always correct.
 *
 * So: one function, showing decimals when the value carries them. Correct for
 * invoice totals, rents, rates, and unit prices alike. Do not reintroduce a
 * rounding variant — its default would be lossy, and a call site that forgot to
 * opt out would silently show a figure nobody entered.
 */

/** Matches the four decimal places the API records rates at, so nothing is lost. */
const MAX_FRACTION_DIGITS = 4

/**
 * Formats a monetary value as Vietnamese dong.
 *
 * A whole value is shown whole; a fractional one keeps its fraction. Absent
 * values render as a dash rather than zero — an unrecorded amount and a zero
 * amount are different things.
 */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: MAX_FRACTION_DIGITS,
  }).format(value)
}
