/**
 * Turning the API's dates into the days a reader acts on.
 *
 * ── The one rule this file exists for ───────────────────────────────────────
 *
 * A date that ends a tenancy is EXCLUSIVE: it is the first day no longer
 * covered. A lease beginning 1 January for six months ends on 1 July and covers
 * through 30 June. A move-out recorded as 5 July covers through 4 July.
 *
 * That convention is right for the system — it is what makes a renewal abut its
 * predecessor with neither a gap nor an overlap, and every calculation in the
 * backend depends on it. It is wrong for a person. An owner reading
 * "ends 01/07/2026" arranges the cleaner for the 1st, shows the room on the
 * 1st, and expects the tenant gone a day after they were entitled to be there.
 *
 * So the boundary is converted here, once, rather than being formatted directly
 * anywhere. Nothing in this feature should call a date formatter on
 * `expectedEndDate` or `moveOutDate` without going through `coveredThrough`.
 *
 * The alternative — asking the API for a covered-through date as well — was
 * rejected in design.md: two dates meaning almost the same thing is how two
 * dates drift apart. This is genuinely presentation, so it lives in
 * presentation.
 */

/**
 * The last day a tenancy covers, from the exclusive boundary the API reports.
 *
 * Date-only arithmetic on a date-only value: the API sends these at midnight
 * UTC, and subtracting a day in UTC cannot land in the previous day the way a
 * local-time subtraction can for a reader east or west of the server.
 */
export function coveredThrough(exclusiveEnd: string): Date {
  const boundary = new Date(exclusiveEnd)
  return new Date(boundary.getTime() - 24 * 60 * 60 * 1000)
}

/** A date as a reader expects it. Absent renders as a dash, never as today. */
export function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { timeZone: 'UTC' })
}

/** The last day covered, formatted. The only way this feature shows an ending. */
export function formatCoveredThrough(exclusiveEnd: string | null | undefined): string {
  if (!exclusiveEnd) return '—'
  return formatDate(coveredThrough(exclusiveEnd))
}

/**
 * Whether a running tenancy's agreed term has already run out.
 *
 * Judged against the same exclusive boundary the API uses for its own overdue
 * filter, so the mark shown in the list and the rows that filter returns cannot
 * disagree. A tenancy that has recorded a move-out is never overdue however
 * long ago its term ended — it has been closed, and needs nothing.
 */
export function isTermRunOut(lease: {
  status: string
  expectedEndDate: string
  moveOutDate: string | null
}): boolean {
  if (lease.status !== 'active' || lease.moveOutDate !== null) return false
  return new Date(lease.expectedEndDate).getTime() <= Date.now()
}
