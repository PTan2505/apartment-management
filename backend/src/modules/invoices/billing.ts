import { Prisma } from "@/generated/prisma/client.js";

const Decimal = Prisma.Decimal;
type DecimalValue = Prisma.Decimal;

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
 */
export function resolveOccupiedPeriod(
  year: number,
  month: number,
  leaseStart: Date,
  moveOutDate: Date | null,
): OccupiedPeriod | null {
  const monthStart = startOfMonth(year, month);
  const monthEnd = endOfMonth(year, month);

  const periodStart = leaseStart > monthStart ? leaseStart : monthStart;
  const periodEnd = moveOutDate !== null && moveOutDate < monthEnd ? moveOutDate : monthEnd;

  if (periodStart > periodEnd) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysOccupied =
    Math.round((periodEnd.getTime() - periodStart.getTime()) / msPerDay) + 1;

  return { periodStart, periodEnd, daysOccupied, daysInMonth: daysInMonth(year, month) };
}

export interface ChargeInputs {
  baseRent: DecimalValue;
  electricityRate: DecimalValue;
  waterRatePerPerson: DecimalValue;
  occupantCount: number;
  previousElectricityUse: number;
  currentElectricityUse: number;
  period: OccupiedPeriod;
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
  const { period } = input;
  const isFullMonth = period.daysOccupied >= period.daysInMonth;

  const prorate = (amount: DecimalValue) =>
    isFullMonth
      ? amount
      : amount.mul(period.daysOccupied).div(period.daysInMonth);

  const consumption = input.currentElectricityUse - input.previousElectricityUse;

  const rentAmount = prorate(input.baseRent).toDecimalPlaces(0);
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
