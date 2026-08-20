import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { computeCharges, resolveOccupiedPeriod } from "./billing.js";
import type { GenerateInvoiceInput, ListInvoicesQuery, MarkPaidInput } from "./schema.js";

async function findInvoiceOrThrow(id: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    throw new NotFoundError("Invoice not found");
  }
  return invoice;
}

/**
 * A lease's first invoice opens from the reading the lease itself started from;
 * every later one opens from that lease's previous invoice. Never from the
 * room's history — that would charge a new tenant for the previous tenancy's
 * consumption and for whatever the meter recorded while the room was empty.
 */
async function resolveOpeningReading(leaseId: number, startMeterReading: number) {
  const previous = await prisma.invoice.findFirst({
    where: { leaseId, voidedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { currentElectricityUse: true },
  });

  return previous?.currentElectricityUse ?? startMeterReading;
}

export async function generateInvoice(input: GenerateInvoiceInput) {
  const lease = await prisma.lease.findUnique({
    where: { id: input.leaseId },
    include: { room: { include: { building: true } } },
  });
  if (!lease) {
    throw new NotFoundError("Lease not found");
  }

  // A finalized lease is still billable for the months it covered — a tenancy
  // that ended on the 15th owes for those 15 days.
  const period = resolveOccupiedPeriod(
    input.year,
    input.month,
    lease.startDate,
    lease.moveOutDate,
  );
  if (!period) {
    throw new ValidationError(
      "That month falls outside the period this lease occupied the room",
    );
  }

  const existing = await prisma.invoice.findFirst({
    where: { leaseId: input.leaseId, year: input.year, month: input.month, voidedAt: null },
  });
  if (existing) {
    throw new ConflictError("That lease already has an invoice for that month");
  }

  const previousElectricityUse = await resolveOpeningReading(
    lease.id,
    lease.startMeterReading,
  );
  if (input.currentElectricityUse < previousElectricityUse) {
    throw new ValidationError(
      "Closing meter reading cannot be below the opening reading for this period",
    );
  }

  const charges = computeCharges({
    // The lease's own agreed rent, not the room's current asking rent. A tenant
    // is billed what their agreement says, so editing the room after a lease
    // was signed must not change what that lease is charged.
    baseRent: lease.baseRent,
    electricityRate: lease.room.building.electricityRate,
    waterRatePerPerson: lease.room.building.waterRatePerPerson,
    occupantCount: lease.occupantCount,
    previousElectricityUse,
    currentElectricityUse: input.currentElectricityUse,
    period,
  });

  return prisma.invoice.create({
    data: {
      leaseId: lease.id,
      year: input.year,
      month: input.month,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      previousElectricityUse,
      currentElectricityUse: input.currentElectricityUse,
      // Copied at issue time so later rate or occupant changes cannot rewrite
      // what this bill charged.
      electricityRate: lease.room.building.electricityRate,
      waterRatePerPerson: lease.room.building.waterRatePerPerson,
      baseRent: lease.baseRent,
      occupantCount: lease.occupantCount,
      ...charges,
    },
  });
}

export async function listInvoices(query: ListInvoicesQuery) {
  const where = {
    ...(query.leaseId ? { leaseId: query.leaseId } : {}),
    ...(query.year ? { year: query.year } : {}),
    ...(query.month ? { month: query.month } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.includeVoided ? {} : { voidedAt: null }),
    ...(query.roomId || query.buildingId
      ? {
          lease: {
            ...(query.roomId ? { roomId: query.roomId } : {}),
            ...(query.buildingId ? { room: { buildingId: query.buildingId } } : {}),
          },
        }
      : {}),
  };

  return paginate(
    query,
    prisma.invoice.findMany({
      where,
      orderBy: [{ year: "asc" }, { month: "asc" }, { id: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.invoice.count({ where }),
  );
}

export async function getInvoiceById(id: number) {
  return findInvoiceOrThrow(id);
}

export async function markPaid(id: number, input: MarkPaidInput) {
  const invoice = await findInvoiceOrThrow(id);

  if (invoice.voidedAt !== null) {
    throw new ConflictError("Cannot record payment against a voided invoice");
  }
  if (invoice.paymentStatus === "paid") {
    throw new ConflictError("That invoice has already been paid");
  }

  return prisma.invoice.update({
    where: { id },
    data: {
      paymentStatus: "paid",
      paymentMethod: input.paymentMethod,
      paidAt: input.paidAt,
    },
  });
}

/**
 * An issued invoice is a record of what was charged, so it is voided rather
 * than edited. The void frees the lease/month slot (the unique index ignores
 * voided rows) while keeping the original visible.
 */
export async function voidInvoice(id: number) {
  const invoice = await findInvoiceOrThrow(id);

  if (invoice.voidedAt !== null) {
    throw new ConflictError("That invoice has already been voided");
  }

  return prisma.invoice.update({ where: { id }, data: { voidedAt: new Date() } });
}
