/**
 * A month's figures for one building.
 *
 * ── The distinction this whole screen is built around ──────────────────────
 *
 * Every figure here EXCEPT `received` is keyed on the month an invoice was
 * ISSUED. `received` is keyed on the dates money actually arrived. An invoice
 * issued in March and paid in May counts toward March in `settled` and toward
 * May in `received`, and the two are never to be compared or subtracted.
 */
export interface MonthFigures {
  year: number
  month: number
  /** Revenue billed out in this month. Deposits excluded — they are held, not earned. */
  billed: number
  /** Of that, what has since been paid. Still keyed on the month BILLED. */
  settled: number
  /** Of that, what is still owed. `billed` equals `settled` plus `outstanding`. */
  outstanding: number
  expenses: number
  /** May be negative. A loss-making month is information, not an error. */
  netBilled: number
  netSettled: number
  /** The only cash figure: money that ARRIVED in this month, whenever billed. */
  received: number
  counts: MonthCounts
  /**
   * The rooms behind this month's figures.
   *
   * Optional because the API reports it only when asked. Absent means NOT
   * REQUESTED — deliberately distinguishable from an empty array, which would
   * mean the month covered no rooms at all.
   */
  rooms?: RoomFigures[]
}

/**
 * How many rooms a month's figures cover.
 *
 * `roomsUnbilled` is counted apart from `roomsSettled` on purpose. A room
 * nobody invoiced owes nothing, so folding the two together makes the
 * arithmetic work — and reports a building where rooms were never billed as
 * having collected from them. The three sum to `rooms`.
 */
export interface MonthCounts {
  rooms: number
  roomsSettled: number
  roomsOutstanding: number
  roomsUnbilled: number
  expenseRecords: number
}

/**
 * One room beneath a month.
 *
 * Notice there is no cash figure. Every value here is keyed on the month the
 * invoice was ISSUED; the money-arrived figure is keyed on the day it arrived,
 * and one row carrying both would assert they are measured the same way.
 */
export interface RoomFigures {
  roomId: number
  roomCode: string
  leaseId: number | null
  /** Absent where the tenancy has nobody recorded — a real state, not a gap. */
  tenantName: string | null
  billed: number
  settled: number
  outstanding: number
}

export type CategoryBreakdown = Record<string, number>

/**
 * Totals over the whole range.
 *
 * Counts and room rows are absent, and that is not an omission: summing rooms
 * across months gives room-months while looking exactly like a number of rooms.
 */
export interface Totals extends Omit<MonthFigures, 'year' | 'month' | 'counts' | 'rooms'> {
  expensesByCategory: CategoryBreakdown
  /**
   * A PARTITION of `billed`, not an addition to it. An owner-named charge
   * appears in both, once — rendering this beside `billed` invites a reader to
   * add them and count the same money twice.
   */
  chargesByCategory: CategoryBreakdown
}

export interface BuildingReport {
  buildingId: number
  displayName: string
  months: MonthFigures[]
  total: Totals
}

export interface RevenueReport {
  range: { from: string; to: string }
  buildings: BuildingReport[]
  total: Totals
}

export interface RevenueReportParams {
  /** `YYYY-MM`. */
  from: string
  to: string
  buildingIds?: number[]
}
