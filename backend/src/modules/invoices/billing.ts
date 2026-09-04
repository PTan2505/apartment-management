import { Prisma } from "@/generated/prisma/client.js";

const Decimal = Prisma.Decimal;
type DecimalValue = Prisma.Decimal;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Days in a calendar month, honouring leap years. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, daysInMonth(year, month)));
}

export interface OccupiedPeriod {
  periodStart: Date;
  periodEnd: Date;
  daysOccupied: number;
  daysInMonth: number;
}

/**
 * The slice of a calendar month a tenancy actually occupied. Both the first and
 * last day count, so a lease running the 16th to the 31st is 16 days, not 15 —
 * the tenant slept there on both.
 *
 * Returns null when the lease did not overlap the month at all.
 *
 * ── One rule for ending dates ───────────────────────────────────────────────
 *
 * A date that ends a tenancy is EXCLUSIVE: it is the first day no longer
 * covered, so the last covered day is the one before it. This holds for both
 * ending dates, which is what lets a new lease begin on exactly the date the
 * previous one ended, with no day billed twice and none left uncovered:
 *
 *     expectedEndDate 2026-07-01  →  covers through 2026-06-30
 *     moveOutDate     2026-05-10  →  covers through 2026-05-09
 *
 * Reading them by opposite rules — as this once did, counting the move-out day
 * but not the term day — makes a renewal beginning on the recorded end date
 * bill that day twice, and leaves every future reader having to remember which
 * field counts its own day.
 *
 * ── Which date, and why the choice is asymmetric ────────────────────────────
 *
 * A recorded move-out is a fact: someone confirmed the tenant left, so it
 * bounds the period even when it falls past the agreed term. An owner may
 * legitimately record a departure a few days late when neither side wanted a
 * renewal, and what to charge for those days is their judgement rather than
 * something to decide here.
 *
 * An ABSENT move-out is not the fact that the tenant is still there — it is the
 * absence of any record at all. Without the term as a bound this function
 * happily reports that a six-month lease occupied its hundredth month, and the
 * invoice built on that answer bills time nobody ever agreed to. So the term
 * bounds an unclosed lease, and the owner must either record the departure or
 * create a new lease before billing can continue.
 */
export function resolveOccupiedPeriod(
  year: number,
  month: number,
  leaseStart: Date,
  moveOutDate: Date | null,
  /** Exclusive. Bounds the period only when no move-out has been recorded. */
  expectedEndDate: Date,
): OccupiedPeriod | null {
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);

  // A recorded move-out speaks for itself; without one, the agreement is all
  // there is to go on. Both are read the same way — the day before is the last
  // one covered — so the asymmetry is only in WHICH date is chosen.
  const endsOn = moveOutDate ?? expectedEndDate;
  const lastCoveredDay = new Date(endsOn.getTime() - MS_PER_DAY);

  const periodStart = leaseStart > monthStart ? leaseStart : monthStart;
  const periodEnd = lastCoveredDay < monthEnd ? lastCoveredDay : monthEnd;

  if (periodStart > periodEnd) {
    return null;
  }

  const daysOccupied =
    Math.round((periodEnd.getTime() - periodStart.getTime()) / MS_PER_DAY) + 1;

  return { periodStart, periodEnd, daysOccupied, daysInMonth: daysInMonth(year, month) };
}

/**
 * The slice of the month AFTER the one being billed that the lease covers.
 *
 * Rent is paid before the month it covers, so a bill settling January's
 * utilities carries February's rent. That rent is prorated against FEBRUARY —
 * prorating it by January's occupancy would reduce February's rent for days
 * January was empty, which is unrelated and produces a plausible wrong number.
 *
 * Returns null when the lease does not reach into that month at all, which is
 * how a caller learns there is no rent left to charge and the month's utilities
 * belong on a final invoice instead.
 */
export function resolveRentPeriod(
  year: number,
  month: number,
  leaseStart: Date,
  moveOutDate: Date | null,
  expectedEndDate: Date,
): OccupiedPeriod | null {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  return resolveOccupiedPeriod(nextYear, nextMonth, leaseStart, moveOutDate, expectedEndDate);
}

/**
 * Whether a tenancy can be issued a MONTHLY invoice for a given month, and the
 * two periods that bill would be computed from.
 *
 * The one place that answers this. It is asked from two directions — the screen
 * asking what is still to be billed for a month, and the endpoint issuing one —
 * and those two answers have to agree permanently. A second copy would offer
 * the owner a row the API then refuses, which is a form arguing with itself,
 * and it would drift silently because nothing compares the two.
 *
 * It answers WHY where the answer is no, because the issuing path has to report
 * a reason and a listing has to know which rows to leave out; collapsing both
 * into a bare boolean would push the distinction back into a caller.
 *
 * Nothing here reads the database. Whether an invoice for that month ALREADY
 * exists is a separate question, asked separately by both callers.
 */
export type MonthlyBillability =
  | { billable: true; period: OccupiedPeriod; rentPeriod: OccupiedPeriod }
  | { billable: false; reason: "cancelled" | "not_occupied" | "no_rent_left" };

export function monthlyBillability(
  year: number,
  month: number,
  lease: {
    startDate: Date;
    moveOutDate: Date | null;
    cancelledAt: Date | null;
    /** Exclusive. The first day the agreed term no longer covers. */
    expectedEndDate: Date;
  },
): MonthlyBillability {
  // A cancelled tenancy occupied no day of any month, so there is nothing to
  // meter and nothing to prorate. Checked first: the period arithmetic below
  // would happily produce a plausible answer for it, since a cancelled lease
  // keeps the dates it was agreed on.
  if (lease.cancelledAt !== null) {
    return { billable: false, reason: "cancelled" };
  }

  const period = resolveOccupiedPeriod(
    year,
    month,
    lease.startDate,
    lease.moveOutDate,
    lease.expectedEndDate,
  );
  if (period === null) {
    return { billable: false, reason: "not_occupied" };
  }

  // Rent is charged for the month AFTER the one billed. No such month within
  // the term means there is no rent left to charge, and that month's utilities
  // belong on the final invoice — an invoice with no rent is what a FINAL
  // invoice is.
  const rentPeriod = resolveRentPeriod(
    year,
    month,
    lease.startDate,
    lease.moveOutDate,
    lease.expectedEndDate,
  );
  if (rentPeriod === null) {
    return { billable: false, reason: "no_rent_left" };
  }

  return { billable: true, period, rentPeriod };
}

/**
 * The slice of the month a tenancy BEGINS in that it covers, from the start
 * date to the end of that month. What a move-in invoice charges rent for.
 */
export function resolveFirstRentPeriod(
  leaseStart: Date,
  moveOutDate: Date | null,
  expectedEndDate: Date,
): OccupiedPeriod | null {
  return resolveOccupiedPeriod(
    leaseStart.getUTCFullYear(),
    leaseStart.getUTCMonth() + 1,
    leaseStart,
    moveOutDate,
    expectedEndDate,
  );
}

export interface ChargeInputs {
  baseRent: DecimalValue;
  electricityRate: DecimalValue;
  waterRatePerPerson: DecimalValue;
  occupantCount: number;
  previousElectricityUse: number;
  currentElectricityUse: number;
  /** The billed month: what water is prorated against, and what electricity spans. */
  period: OccupiedPeriod;
  /**
   * The month rent is charged FOR, which is not the billed month once rent is
   * paid in advance. Null charges no rent — a final invoice, whose month was
   * already paid for on the invoice before it.
   */
  rentPeriod: OccupiedPeriod | null;
}

export interface Charges {
  rentAmount: DecimalValue;
  electricityAmount: DecimalValue;
  waterAmount: DecimalValue;
  totalAmount: DecimalValue;
}

/**
 * Rent and water are flat monthly charges, so occupying part of a month earns a
 * proportional share. Electricity is deliberately NOT prorated: the meter has
 * already measured exactly what was consumed, and scaling that by days would
 * discount a measured quantity a second time.
 *
 * Each charge is rounded to whole units and the total is their sum, so the line
 * items on a bill visibly add up — rounding an unrounded total instead can
 * leave rent + electricity + water differing from the stated total.
 */
export function computeCharges(input: ChargeInputs): Charges {
  const { period, rentPeriod } = input;
  const isFullMonth = period.daysOccupied >= period.daysInMonth;

  const prorate = (amount: DecimalValue) =>
    isFullMonth
      ? amount
      : amount.mul(period.daysOccupied).div(period.daysInMonth);

  const consumption = input.currentElectricityUse - input.previousElectricityUse;

  // Rent against its OWN month, never against the billed one.
  const rentAmount =
    rentPeriod === null
      ? new Decimal(0)
      : (rentPeriod.daysOccupied >= rentPeriod.daysInMonth
          ? input.baseRent
          : input.baseRent.mul(rentPeriod.daysOccupied).div(rentPeriod.daysInMonth)
        ).toDecimalPlaces(0);
  const waterAmount = prorate(
    input.waterRatePerPerson.mul(input.occupantCount),
  ).toDecimalPlaces(0);
  const electricityAmount = input.electricityRate.mul(consumption).toDecimalPlaces(0);

  return {
    rentAmount,
    electricityAmount,
    waterAmount,
    totalAmount: rentAmount.add(electricityAmount).add(waterAmount),
  };
}

export { Decimal };

export interface LineItemRow {
  kind: "rent" | "electricity" | "water" | "serviceFee" | "deposit";
  description: string;
  quantity: DecimalValue | null;
  unitAmount: DecimalValue | null;
  amount: DecimalValue;
  position: number;
  /** The span this charge is for. Null for a deposit, which covers no span. */
  periodStart: Date | null;
  periodEnd: Date | null;
}

/**
 * Turns computed charges into the rows that record them.
 *
 * Deliberately separate from `computeCharges`, which is untouched by this
 * change: the figures are the same, only where they are written has moved.
 *
 * `quantity` and `unitAmount` are the FULL-MONTH basis. For a partial month
 * `amount` is that basis reduced by the days occupied, so amount does not equal
 * quantity times unitAmount — the invoice's own period accounts for the
 * difference. Putting the fraction into quantity would lose the rate: 0.548387
 * tells a reader nothing about the rent being 3,000,000.
 *
 * Rent carries no quantity. A fabricated 1 reads as information and is not.
 */
export function buildLineItems(input: ChargeInputs, charges: Charges): LineItemRow[] {
  const consumption = input.currentElectricityUse - input.previousElectricityUse;
  const { period, rentPeriod } = input;

  const lines: LineItemRow[] = [];

  // Rent carries the period it is FOR, which is a different month from the
  // utilities beside it. Without that, a reader of the bill cannot tell.
  if (rentPeriod !== null) {
    lines.push({
      kind: "rent",
      description: `Rent ${monthLabel(rentPeriod.periodStart)}`,
      quantity: null,
      unitAmount: input.baseRent,
      amount: charges.rentAmount,
      position: 1,
      periodStart: rentPeriod.periodStart,
      periodEnd: rentPeriod.periodEnd,
    });
  }

  lines.push({
    kind: "electricity",
    description: `Electricity ${consumption} kWh`,
    quantity: new Decimal(consumption),
    unitAmount: input.electricityRate,
    amount: charges.electricityAmount,
    position: 2,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });

  lines.push({
    kind: "water",
    description: `Water, ${input.occupantCount} occupant(s)`,
    quantity: new Decimal(input.occupantCount),
    unitAmount: input.waterRatePerPerson,
    amount: charges.waterAmount,
    position: 3,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
  });

  return lines;
}

/** "2026-02", for a description a reader can place without opening the period. */
function monthLabel(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface ServiceFeeCharge {
  buildingServiceFeeId: number;
  name: string;
  unitAmount: DecimalValue;
  quantity: number;
  /** Days of the billed month this fee actually applied for. */
  daysCharged: number;
  amount: DecimalValue;
}

export interface ServiceFeePeriod {
  buildingServiceFeeId: number;
  name: string;
  unitAmount: DecimalValue;
  quantity: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}

/**
 * Charges a lease's service fees for a billed period.
 *
 * A fee is prorated by the INTERSECTION of two windows, not by either alone:
 *
 *     days the tenancy occupied   ∩   days the fee applied   =   days charged
 *
 * Prorating by the tenancy alone charges a fee the tenant gave up on the 15th
 * for the whole month. Prorating by the fee's own window alone charges a tenant
 * who moved out on the 10th for days they were not there. Both are wrong on the
 * same invoice, so the intersection is the rule rather than a refinement.
 *
 * `effectiveTo` is exclusive, matching every other ending date in this system:
 * a fee given up on the 15th applied through the 14th.
 *
 * A fee whose window does not reach the period at all yields no line — not a
 * zero one. A charge of nothing is noise on a bill.
 */
export function computeServiceFeeCharges(
  period: OccupiedPeriod,
  fees: ServiceFeePeriod[],
): ServiceFeeCharge[] {
  const charges: ServiceFeeCharge[] = [];

  for (const fee of fees) {
    // Clamp the occupied window to the fee's own.
    const from = fee.effectiveFrom > period.periodStart ? fee.effectiveFrom : period.periodStart;
    const feeLastDay =
      fee.effectiveTo === null
        ? period.periodEnd
        : new Date(fee.effectiveTo.getTime() - MS_PER_DAY);
    const to = feeLastDay < period.periodEnd ? feeLastDay : period.periodEnd;

    if (from > to) continue;

    const daysCharged = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
    const full = fee.unitAmount.mul(fee.quantity);
    const amount =
      daysCharged >= period.daysInMonth
        ? full.toDecimalPlaces(0)
        : full.mul(daysCharged).div(period.daysInMonth).toDecimalPlaces(0);

    charges.push({
      buildingServiceFeeId: fee.buildingServiceFeeId,
      name: fee.name,
      unitAmount: fee.unitAmount,
      quantity: fee.quantity,
      daysCharged,
      amount,
    });
  }

  return charges;
}

/** Service fee lines, following the three computed ones. */
export function buildServiceFeeLineItems(
  charges: ServiceFeeCharge[],
  startPosition: number,
  period: OccupiedPeriod,
): (LineItemRow & { buildingServiceFeeId: number })[] {
  return charges.map((charge, index) => ({
    kind: "serviceFee" as const,
    description: charge.name,
    quantity: new Decimal(charge.quantity),
    unitAmount: charge.unitAmount,
    amount: charge.amount,
    position: startPosition + index,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    buildingServiceFeeId: charge.buildingServiceFeeId,
  }));
}
