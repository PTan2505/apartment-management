import { Prisma } from "@/generated/prisma/client.js";
import { ValidationError } from "@/lib/errors.js";
import { addMonths } from "@/modules/leases/mapper.js";
import {
  buildLineItems,
  buildServiceFeeLineItems,
  computeCharges,
  computeServiceFeeCharges,
  daysInMonth,
  resolveFirstRentPeriod,
  resolveOccupiedPeriod,
  type LineItemRow,
} from "./billing.js";

const Decimal = Prisma.Decimal;

/**
 * Issuing a move-in, final or overdue invoice.
 *
 * These are issued by the operations that cause them — creating a lease, and
 * recording a move-out — rather than by an endpoint of their own, and inside
 * those operations' transactions. A tenancy whose deposit was never charged is
 * not a tenancy anybody has actually started, and a closed tenancy whose last
 * month was never billed loses that money silently.
 *
 * Every function here therefore takes the caller's transaction client. Nothing
 * in this file opens one.
 */
type Tx = Prisma.TransactionClient;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function monthLabel(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface LeaseForIssue {
  id: number;
  startDate: Date;
  durationMonths: number;
  occupantCount: number;
  startMeterReading: number;
  baseRent: Prisma.Decimal;
  depositMonths: number;
  room: { buildingId: number; building: { electricityRate: Prisma.Decimal; waterRatePerPerson: Prisma.Decimal } };
}

/**
 * The bill that starts a tenancy: the deposit agreed, and rent from the start
 * date to the end of that calendar month.
 *
 * It carries no year, month, period or meter readings. Nothing on it was
 * metered and neither charge belongs to a month of occupancy — the deposit
 * belongs to no span at all, and the rent's span is recorded on its own line.
 */
export async function issueMoveInInvoice(tx: Tx, lease: LeaseForIssue, issueDate: Date) {
  const expectedEndDate = addMonths(lease.startDate, lease.durationMonths);
  const rentPeriod = resolveFirstRentPeriod(lease.startDate, null, expectedEndDate);
  if (rentPeriod === null) {
    throw new ValidationError("This lease covers no days, so there is nothing to charge");
  }

  const rentAmount = (
    rentPeriod.daysOccupied >= rentPeriod.daysInMonth
      ? lease.baseRent
      : lease.baseRent.mul(rentPeriod.daysOccupied).div(rentPeriod.daysInMonth)
  ).toDecimalPlaces(0);

  const lines: LineItemRow[] = [
    {
      kind: "rent",
      description: `Rent ${monthLabel(rentPeriod.periodStart)}`,
      quantity: null,
      unitAmount: lease.baseRent,
      amount: rentAmount,
      position: 1,
      periodStart: rentPeriod.periodStart,
      periodEnd: rentPeriod.periodEnd,
    },
  ];

  // A lease agreed without a deposit carries no deposit line — not a line of
  // zero. A charge of nothing is noise on a bill.
  if (lease.depositMonths > 0) {
    const depositAmount = lease.baseRent.mul(lease.depositMonths).toDecimalPlaces(0);
    lines.push({
      kind: "deposit",
      description: `Deposit, ${lease.depositMonths} month(s) of rent`,
      quantity: new Decimal(lease.depositMonths),
      unitAmount: lease.baseRent,
      amount: depositAmount,
      position: 2,
      // No period: a deposit is not charged for a span of time and must not
      // borrow the invoice's.
      periodStart: null,
      periodEnd: null,
    });
  }

  const totalAmount = lines.reduce((running, line) => running.add(line.amount), new Decimal(0));

  return tx.invoice.create({
    data: {
      leaseId: lease.id,
      type: "moveIn",
      issueDate,
      totalAmount,
      lineItems: { create: lines },
    },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
}

/**
 * The bill that closes a tenancy: the utilities of the month of departure, up
 * to the last day the agreement covered, and NO rent — that month's rent was
 * charged a month earlier on the monthly invoice preceding it.
 *
 * Where the departure is late, this covers only the days within the term; the
 * days beyond it are the overdue invoice's. The electricity, however, spans
 * everything up to the handover reading, because a meter measures what it
 * measures and cannot be split without a second reading nobody takes.
 */
export async function issueFinalInvoice(
  tx: Tx,
  lease: LeaseForIssue,
  moveOutDate: Date,
  endMeterReading: number,
  issueDate: Date,
) {
  const expectedEndDate = addMonths(lease.startDate, lease.durationMonths);

  // The last day the AGREEMENT covered, which is where the final invoice stops
  // even when the tenant stayed longer.
  const withinTermEnd = moveOutDate < expectedEndDate ? moveOutDate : expectedEndDate;
  const lastCovered = new Date(withinTermEnd.getTime() - MS_PER_DAY);

  const period = resolveOccupiedPeriod(
    lastCovered.getUTCFullYear(),
    lastCovered.getUTCMonth() + 1,
    lease.startDate,
    withinTermEnd,
    expectedEndDate,
  );
  if (period === null) {
    throw new ValidationError("This tenancy covered no days in the month it ended");
  }

  const previous = await resolveOpeningReading(tx, lease.id, lease.startMeterReading);
  if (endMeterReading < previous) {
    throw new ValidationError(
      "Closing meter reading cannot be below the reading already invoiced for this lease",
    );
  }

  const chargeInputs = {
    baseRent: lease.baseRent,
    electricityRate: lease.room.building.electricityRate,
    waterRatePerPerson: lease.room.building.waterRatePerPerson,
    occupantCount: lease.occupantCount,
    previousElectricityUse: previous,
    currentElectricityUse: endMeterReading,
    period,
    // No rent. The month being closed was paid for a month ago.
    rentPeriod: null,
  };

  const charges = computeCharges(chargeInputs);
  const baseLines = buildLineItems(chargeInputs, charges);
  const feeCharges = computeServiceFeeCharges(period, await applicableFees(tx, lease.id, period));
  const feeLines = buildServiceFeeLineItems(feeCharges, baseLines.length + 1, period);
  const totalAmount = feeCharges.reduce(
    (running, charge) => running.add(charge.amount),
    charges.totalAmount,
  );

  return tx.invoice.create({
    data: {
      leaseId: lease.id,
      type: "final",
      issueDate,
      year: period.periodStart.getUTCFullYear(),
      month: period.periodStart.getUTCMonth() + 1,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      previousElectricityUse: previous,
      currentElectricityUse: endMeterReading,
      totalAmount,
      lineItems: { create: [...baseLines, ...feeLines] },
    },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });
}

export interface OverdueCharge {
  buildingServiceFeeId: number;
  amount: number;
}

/**
 * The bill for days no agreement covers.
 *
 * Its charges are named by the owner rather than calculated. There is no
 * agreement to calculate from, and the fee's current price is a fact about
 * today rather than about those days — so the system has no basis to decide
 * what they cost and does not pretend to.
 *
 * Charges are chosen from the building's catalogue so a name stays consistent
 * with every other bill and can still be grouped; only the amount is free.
 *
 * No meter readings: the handover reading was already consumed by the final
 * invoice, which is the only place it can be spent without charging it twice.
 */
export async function issueOverdueInvoice(
  tx: Tx,
  lease: LeaseForIssue,
  moveOutDate: Date,
  charges: OverdueCharge[],
  issueDate: Date,
) {
  const expectedEndDate = addMonths(lease.startDate, lease.durationMonths);
  const lastCovered = new Date(moveOutDate.getTime() - MS_PER_DAY);

  const lines: LineItemRow[] = [];
  let position = 1;

  for (const charge of charges) {
    const fee = await tx.buildingServiceFee.findUnique({
      where: { id: charge.buildingServiceFeeId },
      select: { id: true, name: true, buildingId: true },
    });
    if (!fee) {
      throw new ValidationError("That service fee does not exist");
    }
    if (fee.buildingId !== lease.room.buildingId) {
      throw new ValidationError("That service fee belongs to a different building");
    }

    lines.push({
      kind: "serviceFee",
      description: fee.name,
      quantity: null,
      unitAmount: null,
      amount: new Decimal(charge.amount).toDecimalPlaces(0),
      position: position++,
      periodStart: expectedEndDate,
      periodEnd: lastCovered,
    });
  }

  const totalAmount = lines.reduce((running, line) => running.add(line.amount), new Decimal(0));

  const created = await tx.invoice.create({
    data: {
      leaseId: lease.id,
      type: "overdue",
      issueDate,
      periodStart: expectedEndDate,
      periodEnd: lastCovered,
      totalAmount,
      lineItems: { create: lines },
    },
    include: { lineItems: { orderBy: { position: "asc" } } },
  });

  // Attach the catalogue reference after creation: nested creates cannot set a
  // relation the parent does not own.
  for (let i = 0; i < charges.length; i += 1) {
    await tx.invoiceLineItem.update({
      where: { id: created.lineItems[i]!.id },
      data: { buildingServiceFeeId: charges[i]!.buildingServiceFeeId },
    });
  }

  return created;
}

/** The reading this lease's billing has reached, or where it started. */
async function resolveOpeningReading(tx: Tx, leaseId: number, startMeterReading: number) {
  const previous = await tx.invoice.findFirst({
    where: { leaseId, voidedAt: null, currentElectricityUse: { not: null } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { currentElectricityUse: true },
  });
  return previous?.currentElectricityUse ?? startMeterReading;
}

/** The fees whose effective period overlaps the billed period. */
async function applicableFees(tx: Tx, leaseId: number, period: { periodStart: Date; periodEnd: Date }) {
  const rows = await tx.leaseServiceFee.findMany({
    where: {
      leaseId,
      effectiveFrom: { lte: period.periodEnd },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: period.periodStart } }],
    },
    select: {
      buildingServiceFeeId: true,
      unitAmount: true,
      quantity: true,
      effectiveFrom: true,
      effectiveTo: true,
      buildingServiceFee: { select: { name: true } },
    },
    orderBy: { id: "asc" },
  });

  return rows.map((row) => ({
    buildingServiceFeeId: row.buildingServiceFeeId,
    name: row.buildingServiceFee.name,
    unitAmount: row.unitAmount,
    quantity: row.quantity,
    effectiveFrom: row.effectiveFrom,
    effectiveTo: row.effectiveTo,
  }));
}

export { daysInMonth };
