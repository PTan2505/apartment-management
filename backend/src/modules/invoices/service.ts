import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import {
  buildLineItems,
  buildServiceFeeLineItems,
  computeCharges,
  computeServiceFeeCharges,
  resolveOccupiedPeriod,
  resolveRentPeriod,
} from "./billing.js";
import { addMonths } from "@/modules/leases/mapper.js";
import {
  deductFromDeposit,
  holdFromInvoice,
  releaseFromInvoice,
  restoreDeduction,
} from "@/modules/deposits/holding.js";
import type { GenerateInvoiceInput, ListInvoicesQuery, MarkPaidInput } from "./schema.js";

/**
 * Every site that returns an invoice must carry its lines: the charges now live
 * there, so an invoice without them is a total with nothing accounting for it.
 * Ordered by position so the same invoice reads the same way twice.
 */
const invoiceInclude = {
  lineItems: { orderBy: { position: "asc" } },
} as const;

async function findInvoiceOrThrow(id: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
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
  // Only invoices that metered something. A move-in invoice has no reading and
  // no month either — and since NULL sorts FIRST under a DESC ordering in
  // Postgres, leaving it in makes it win this query and hands back the lease's
  // opening reading for every invoice after the first.
  const previous = await prisma.invoice.findFirst({
    where: { leaseId, voidedAt: null, currentElectricityUse: { not: null } },
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
    addMonths(lease.startDate, lease.durationMonths),
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

  // Named so the computation and the lines it produces read the same inputs —
  // two copies could drift and the bill would stop explaining its own total.
  // Rent is charged for the month AFTER the one billed. No such month within
  // the term means there is no rent left to charge, and that month's utilities
  // belong on the final invoice — refused rather than silently issued without a
  // rent line, because an invoice with no rent is what a FINAL invoice is.
  const rentPeriod = resolveRentPeriod(
    input.year,
    input.month,
    lease.startDate,
    lease.moveOutDate,
    addMonths(lease.startDate, lease.durationMonths),
  );
  if (rentPeriod === null) {
    throw new ValidationError(
      "The month after this one falls outside the lease's term, so there is no rent to charge — its utilities belong on the final invoice",
    );
  }

  const chargeInputs = {
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
    rentPeriod,
  };

  const charges = computeCharges(chargeInputs);

  // Which fees applied DURING the billed period — deliberately not which the
  // lease holds now. The two differ only when an invoice is generated late,
  // which is exactly when reading the present would be wrong and would look
  // right in every on-time test.
  const applicableFees = await prisma.leaseServiceFee.findMany({
    where: {
      leaseId: lease.id,
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

  const feeCharges = computeServiceFeeCharges(
    period,
    applicableFees.map((fee) => ({
      buildingServiceFeeId: fee.buildingServiceFeeId,
      name: fee.buildingServiceFee.name,
      unitAmount: fee.unitAmount,
      quantity: fee.quantity,
      effectiveFrom: fee.effectiveFrom,
      effectiveTo: fee.effectiveTo,
    })),
  );

  const baseLines = buildLineItems(chargeInputs, charges);
  const feeLines = buildServiceFeeLineItems(feeCharges, baseLines.length + 1, period);
  const totalAmount = feeCharges.reduce(
    (running, charge) => running.add(charge.amount),
    charges.totalAmount,
  );

  // The lines and the total are written together, in one statement, so a total
  // never exists without the charges that account for it.
  return prisma.invoice.create({
    data: {
      leaseId: lease.id,
      year: input.year,
      month: input.month,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      // Fixed by the operation, not by the caller — this endpoint issues
      // monthly invoices and nothing else.
      type: "monthly",
      issueDate: input.issueDate ?? new Date(),
      previousElectricityUse,
      currentElectricityUse: input.currentElectricityUse,
      totalAmount,
      // Each rate and count is copied onto the line it produced, at issue time,
      // so a later rate or occupant change cannot rewrite what this bill charged.
      lineItems: { create: [...baseLines, ...feeLines] },
    },
    include: invoiceInclude,
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
      include: invoiceInclude,
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

  // Recording the payment and moving the holdings it touches happen together.
  // An invoice recorded as paid whose deduction was never applied would report
  // the same money collected twice.
  return prisma.$transaction(async (tx) => {
    // Settling out of the deposit spends money the owner has held since the
    // tenancy began. Refused where the lease is not holding enough.
    if (input.paymentMethod === "deposit_deduction") {
      await deductFromDeposit(tx, invoice.leaseId, invoice.totalAmount);
    }

    // Whatever deposit this invoice charged becomes money held, now that it has
    // been paid. An invoice with no deposit line moves nothing.
    await holdFromInvoice(tx, invoice.leaseId, invoice.lineItems);

    return tx.invoice.update({
      where: { id },
      data: {
        paymentStatus: "paid",
        paymentMethod: input.paymentMethod,
        paidAt: input.paidAt,
      },
      include: invoiceInclude,
    });
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

  return prisma.$transaction(async (tx) => {
    // A void only unwinds holdings the invoice actually moved, which is to say
    // holdings it moved by being PAID. An unpaid invoice established nothing.
    if (invoice.paymentStatus === "paid") {
      await releaseFromInvoice(tx, invoice.leaseId, invoice.lineItems);

      if (invoice.paymentMethod === "deposit_deduction") {
        await restoreDeduction(tx, invoice.leaseId, invoice.totalAmount);
      }
    }

    return tx.invoice.update({
      where: { id },
      data: { voidedAt: new Date() },
      include: invoiceInclude,
    });
  });
}
