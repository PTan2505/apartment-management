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

/**
 * A date as a reader expects it. Absent renders as a dash, never as today.
 *
 * Two-digit day and month are stated rather than left to the locale. `vi-VN`
 * alone renders 25 August as `25/8/2026`, dropping the leading zero — which
 * changes the width of a date from row to row, and these appear in columns.
 * With them stated, the output is `25/08/2026`, exactly what this produced
 * before.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (value === null || value === undefined) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** The last day covered, formatted. The only way this feature shows an ending. */
export function formatCoveredThrough(exclusiveEnd: string | null | undefined): string {
  if (!exclusiveEnd) return '—'
  return formatDate(coveredThrough(exclusiveEnd))
}

/**
 * How much of an agreed term is left, in whole months and days.
 *
 * Null once there is nothing left to report — the boundary has passed, or the
 * tenancy is no longer running. That absence is the point: a tenancy that ended
 * in March has no remaining time, and rendering the arithmetic anyway produces
 * "còn 0 tháng", which states something false with total confidence.
 *
 * This is arithmetic over dates the API already sent, not a second copy of a
 * rule the server owns. `cancellable` stays on the API for exactly the opposite
 * reason: it encodes a decision, and a second implementation of a decision is
 * free to disagree with the first.
 */
export function remainingTerm(lease: {
  status: string
  expectedEndDate: string
  moveOutDate: string | null
}): { months: number; days: number } | null {
  if (lease.status !== 'active' || lease.moveOutDate !== null) return null

  // The last day covered, not the exclusive boundary — a tenancy running
  // through today has a day left, not none.
  const end = coveredThrough(lease.expectedEndDate)
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  if (end.getTime() < today) return null

  let months = 0
  // Counted by stepping whole calendar months rather than dividing by an
  // average month: "3 tháng 2 ngày" has to mean the calendar's months, or it
  // disagrees with the end date printed directly beneath it.
  const cursor = new Date(today)
  for (;;) {
    const next = new Date(cursor)
    next.setUTCMonth(next.getUTCMonth() + 1)
    if (next.getTime() > end.getTime()) break
    cursor.setTime(next.getTime())
    months += 1
  }
  const days = Math.round((end.getTime() - cursor.getTime()) / (24 * 60 * 60 * 1000))
  return { months, days }
}

/** The remaining term as an owner would say it, or null when there is none. */
export function formatRemainingTerm(lease: {
  status: string
  expectedEndDate: string
  moveOutDate: string | null
}): string | null {
  const left = remainingTerm(lease)
  if (left === null) return null
  if (left.months === 0 && left.days === 0) return 'Hết hạn hôm nay'
  if (left.months === 0) return `Còn ${left.days} ngày`
  if (left.days === 0) return `Còn ${left.months} tháng`
  return `Còn ${left.months} tháng ${left.days} ngày`
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
