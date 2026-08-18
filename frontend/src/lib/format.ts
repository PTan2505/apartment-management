/**
 * Display formatting.
 *
 * This is presentation, not transport. Monetary values arrive from the API as
 * numbers already (the backend serialises its Decimal columns that way), so
 * nothing here converts anything — it only renders a number for a human.
 */

/** Formats an amount as Vietnamese dong. */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
