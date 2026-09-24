import type { LeaseStatus } from '@/features/leases/types'

/**
 * The six states of a tenancy, named and coloured in one place.
 *
 * Three of them hid inside "Đang thuê" until the API learned to tell them
 * apart. A tenancy whose term ran out still held its room and could no longer
 * be billed, while reading as ordinary. One ending next week read like one
 * ending next year. One signed for next month read as though somebody were
 * already living there.
 *
 * Here rather than in the list that first showed them: the detail screen names
 * the same states, and two lists of names are two lists to disagree.
 */
const STATUS_LABELS: Record<LeaseStatus, string> = {
  overdue: 'Quá hạn',
  dueSoon: 'Sắp đến hạn',
  active: 'Đang thuê',
  upcoming: 'Chưa bắt đầu',
  finalized: 'Đã kết thúc',
  cancelled: 'Đã huỷ',
}

/**
 * The cancelled one keeps its own colour for the reason it always had: shown as
 * "Đã kết thúc" it would be counted among the times a room was let and a person
 * rented — history that never happened.
 */
const STATUS_COLORS: Record<LeaseStatus, 'error' | 'warning' | 'success' | 'info' | 'default'> = {
  overdue: 'error',
  dueSoon: 'warning',
  active: 'success',
  upcoming: 'info',
  finalized: 'default',
  cancelled: 'error',
}

/**
 * The six in the order the listing puts them in.
 *
 * Written out rather than read off the keys of the map above: the order is the
 * point, and an object's key order is not something to rest a reading order on.
 */
export const LEASE_STATUSES: LeaseStatus[] = [
  'overdue',
  'dueSoon',
  'active',
  'upcoming',
  'finalized',
  'cancelled',
]

export function leaseStatusLabel(status: LeaseStatus): string {
  return STATUS_LABELS[status]
}

export function leaseStatusColor(status: LeaseStatus) {
  return STATUS_COLORS[status]
}

/**
 * Whether the agreement is still live: not handed back, not cancelled.
 *
 * This is what `status === 'active'` used to mean, and every screen that asked
 * it meant this — may it be edited, renewed, closed; is an absent signatory a
 * warning. Splitting `active` into four states would have quietly narrowed all
 * of those to the middle case, taking the "Kết thúc hợp đồng" button off the
 * one tenancy that most needs it: the one whose term already ran out.
 *
 * So the question is asked by name. A screen that genuinely means "running and
 * not near its end" can still compare the status itself.
 */
export function isLive(status: LeaseStatus): boolean {
  return status !== 'finalized' && status !== 'cancelled'
}
