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
}

export type CategoryBreakdown = Record<string, number>

export interface Totals extends Omit<MonthFigures, 'year' | 'month'> {
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
