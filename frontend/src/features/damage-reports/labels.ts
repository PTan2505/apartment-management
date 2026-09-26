import type { ReportState } from '@/features/damage-reports/types'

/**
 * A report's state, as staff name it.
 *
 * A record rather than a function with a fallback, so a fourth state added to
 * the union has to be named here before this compiles.
 */
const STATE_LABELS: Record<ReportState, string> = {
  new: 'Chưa xử lí',
  scheduled: 'Đã hẹn lịch',
  done: 'Đã xong',
}

const STATE_COLORS: Record<ReportState, 'error' | 'warning' | 'success'> = {
  new: 'error',
  scheduled: 'warning',
  done: 'success',
}

export function reportStateLabel(state: ReportState): string {
  return STATE_LABELS[state]
}

export function reportStateColor(state: ReportState) {
  return STATE_COLORS[state]
}

/** The three in the order they happen, which is also the order they are listed. */
export const REPORT_STATES: ReportState[] = ['new', 'scheduled', 'done']

/** A date and time as an owner would read it, or a dash. */
export function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
