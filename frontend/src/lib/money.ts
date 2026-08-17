/**
 * Money conversion at the API boundary.
 *
 * The backend stores monetary columns as Prisma `Decimal` and hands them
 * straight to `res.json()`. `Decimal` serialises as a JSON *string*, so an
 * invoice arrives as `{ "totalAmount": "3450000" }` — not a number. Left alone
 * that produces silently wrong results:
 *
 *     "3000000" * 2          → arithmetic on a string
 *     ["9", "10"].sort()     → "10" before "9", lexicographically
 *     amount.toFixed(0)      → TypeError
 *
 * ── Why this is applied field by field, and never globally ──────────────────
 *
 * The tempting version is one interceptor that walks every response and
 * numifies anything that looks like digits. It corrupts real data:
 *
 *     phone     "0334974582"  →  334974582   leading zero destroyed
 *     roomCode  "0101"        →  101         no longer matches the room
 *
 * The seeded owner's phone number is exactly that shape, so this is not
 * hypothetical. Each domain names its monetary fields explicitly instead — a
 * few lines per module that cannot damage a neighbouring field.
 *
 * Converting to `number` rather than a decimal library is deliberate: these are
 * whole-dong amounts, already rounded server-side (`toDecimalPlaces(0)`), well
 * inside the range integers represent exactly. The frontend displays and sorts
 * them; every arithmetic decision was made by the backend.
 */

/** A monetary value as it arrives over the wire. */
export type MoneyString = string

/**
 * Converts a transported monetary value to a number.
 *
 * `null` and `undefined` pass through unchanged — an absent optional amount is
 * not the same as zero, and collapsing the two would misreport an expense that
 * has no recorded value as one costing nothing.
 */
export function toMoney(value: MoneyString): number
export function toMoney(value: MoneyString | null): number | null
export function toMoney(value: MoneyString | undefined): number | undefined
export function toMoney(
  value: MoneyString | null | undefined,
): number | null | undefined
export function toMoney(
  value: MoneyString | null | undefined,
): number | null | undefined {
  if (value === null || value === undefined) return value

  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new TypeError(
      `Expected a monetary value, received ${JSON.stringify(value)}`,
    )
  }
  return parsed
}

/**
 * Converts the named fields of an object from monetary strings to numbers,
 * leaving every other field untouched.
 *
 * Domain modules use this in their response mappers:
 *
 *     mapMoneyFields(raw, ['rentAmount', 'electricityAmount', 'totalAmount'])
 */
export function mapMoneyFields<T extends object, K extends keyof T>(
  source: T,
  fields: readonly K[],
): Omit<T, K> & { [P in K]: number | null | undefined } {
  const result = { ...source } as Record<string, unknown>
  for (const field of fields) {
    result[field as string] = toMoney(
      source[field] as MoneyString | null | undefined,
    )
  }
  return result as Omit<T, K> & { [P in K]: number | null | undefined }
}

/** Formats an amount as Vietnamese dong for display. */
export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}
