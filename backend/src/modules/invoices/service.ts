import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import {
  buildLineItems,
  buildServiceFeeLineItems,
  computeCharges,
  computeServiceFeeCharges,
  endOfMonth,
  monthlyBillability,
  startOfMonth,
} from "./billing.js";
import { addMonths } from "@/modules/leases/mapper.js";
import {
  deductFromDeposit,
  holdFromInvoice,
  releaseFromInvoice,
  restoreDeduction,
} from "@/modules/deposits/holding.js";
import type {
  GenerateInvoiceInput,
  IssueAdhocInvoiceInput,
  ListDueQuery,
  ListInvoicesQuery,
  VoidInvoiceInput,
  MarkPaidInput,
} from "./schema.js";

const Decimal = Prisma.Decimal;

/**
 * Every site that returns an invoice must carry its lines: the charges now live
 * there, so an invoice without them is a total with nothing accounting for it.
 * Ordered by position so the same invoice reads the same way twice.
 */
const invoiceInclude = {
  lineItems: { orderBy: { position: "asc" } },
  // What settled it, and when. An invoice may carry several over its life —
  // taken, reversed, taken again — so they are listed rather than summarised.
  payments: { orderBy: { id: "asc" } },
} as const;

async function findInvoiceOrThrow(id: number) {
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
  if (!invoice) {
    throw new NotFoundError("INVOICE_NOT_FOUND", "Invoice not found");
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
    throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
  }

  // A finalized lease is still billable for the months it covered — a tenancy
  // that ended on the 15th owes for those 15 days.
  //
  // Asked of the shared rule rather than worked out here, so that what this
  // endpoint accepts and what the month's outstanding list offers cannot drift
  // apart. Each refusal keeps its own words: the reasons are genuinely
  // different and an owner acts differently on each.
  const billability = monthlyBillability(input.year, input.month, {
    startDate: lease.startDate,
    moveOutDate: lease.moveOutDate,
    cancelledAt: lease.cancelledAt,
    expectedEndDate: addMonths(lease.startDate, lease.durationMonths),
  });
  if (!billability.billable) {
    if (billability.reason === "cancelled") {
      throw new ValidationError(
        "INVOICE_LEASE_CANCELLED",
        "That tenancy was cancelled, so it occupied no month and there is nothing to bill",
      );
    }
    if (billability.reason === "not_occupied") {
      throw new ValidationError(
        "INVOICE_MONTH_OUTSIDE_TENANCY",
        "That month falls outside the period this lease occupied the room",
      );
    }
    throw new ValidationError(
      "INVOICE_NO_RENT_LEFT",
      "The month after this one falls outside the lease's term, so there is no rent to charge — its utilities belong on the final invoice",
    );
  }
  const { period, rentPeriod } = billability;

  const existing = await prisma.invoice.findFirst({
    where: { leaseId: input.leaseId, year: input.year, month: input.month, voidedAt: null },
  });
  if (existing) {
    throw new ConflictError("INVOICE_MONTH_ALREADY_BILLED", "That lease already has an invoice for that month");
  }

  const previousElectricityUse = await resolveOpeningReading(
    lease.id,
    lease.startMeterReading,
  );
  if (input.currentElectricityUse < previousElectricityUse) {
    throw new ValidationError(
      "METER_BELOW_PERIOD_OPENING",
      "Closing meter reading cannot be below the opening reading for this period",
    );
  }

  // Named so the computation and the lines it produces read the same inputs —
  // two copies could drift and the bill would stop explaining its own total.
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

/**
 * What is still to be billed for a month.
 *
 * Exists because the question an owner actually has at month end is not "issue
 * this invoice" but "which rooms have I not done yet", and nothing could answer
 * it. A room silently missed is a month of rent never billed and never noticed.
 *
 * Reported by the server rather than assembled by a client on purpose. Working
 * it out means combining the tenancies that occupied the month with the
 * invoices already issued for it, then resolving one opening reading per
 * tenancy — a request per room, and a second copy of a rule this module already
 * owns. Two copies of a billing rule is one that eventually disagrees with the
 * invoices it produced, and it fails quietly: the screen offers a row, the API
 * refuses it.
 *
 * The result is exactly the outstanding work. A tenancy leaves it the moment
 * its invoice for that month exists, and never appears where issuing one would
 * be refused.
 */
export async function listDueForMonth(query: ListDueQuery) {
  const monthStart = startOfMonth(query.year, query.month);
  const monthEnd = endOfMonth(query.year, query.month);

  // A coarse filter, deliberately. It narrows to tenancies that could plausibly
  // have covered the month; whether they actually did is settled below by the
  // same rule the issuing path uses, rather than by a second attempt to express
  // it in SQL.
  const candidates = await prisma.lease.findMany({
    where: {
      cancelledAt: null,
      startDate: { lte: monthEnd },
      OR: [{ moveOutDate: null }, { moveOutDate: { gt: monthStart } }],
      ...(query.buildingId ? { room: { buildingId: query.buildingId } } : {}),
    },
    select: {
      id: true,
      startDate: true,
      durationMonths: true,
      moveOutDate: true,
      cancelledAt: true,
      startMeterReading: true,
      baseRent: true,
      occupantCount: true,
      room: {
        select: {
          id: true,
          roomCode: true,
          building: { select: { id: true, displayName: true } },
        },
      },
      // Who to name on the row. A room code alone is not enough to act on when
      // an owner is checking a reading against the right tenancy.
      occupants: {
        where: { isPrimary: true, leftAt: null },
        select: { user: { select: { id: true, fullName: true, phone: true } } },
        take: 1,
      },
    },
    orderBy: [{ room: { buildingId: "asc" } }, { room: { roomCode: "asc" } }],
  });

  const billable = candidates.filter(
    (lease) =>
      monthlyBillability(query.year, query.month, {
        startDate: lease.startDate,
        moveOutDate: lease.moveOutDate,
        cancelledAt: lease.cancelledAt,
        expectedEndDate: addMonths(lease.startDate, lease.durationMonths),
      }).billable,
  );

  // Already billed, in one query rather than one per tenancy. Voided invoices
  // are excluded: voiding withdraws the bill, so the work is outstanding again.
  const alreadyBilled = await prisma.invoice.findMany({
    where: {
      leaseId: { in: billable.map((lease) => lease.id) },
      year: query.year,
      month: query.month,
      voidedAt: null,
    },
    select: { leaseId: true },
  });
  const billedLeaseIds = new Set(alreadyBilled.map((invoice) => invoice.leaseId));

  const due = billable.filter((lease) => !billedLeaseIds.has(lease.id));

  // The reading each invoice would ACTUALLY open from, resolved by the same
  // function the issuing path calls. A figure that merely resembles it would be
  // worse than none: the whole point is to give a person something to check
  // their typing against, and a plausible wrong number defeats that.
  return Promise.all(
    due.map(async (lease) => ({
      leaseId: lease.id,
      room: { id: lease.room.id, roomCode: lease.room.roomCode },
      building: lease.room.building,
      tenant: lease.occupants[0]?.user ?? null,
      baseRent: lease.baseRent,
      occupantCount: lease.occupantCount,
      previousElectricityUse: await resolveOpeningReading(
        lease.id,
        lease.startMeterReading,
      ),
    })),
  );
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

/**
 * A bill for what the system cannot calculate: a lost key, a room left dirty, a
 * broken window, a penalty.
 *
 * Its charges are named, categorised and priced by the owner. Every other
 * charge here follows from an agreement and a measurement; these follow from a
 * judgement, and the system records that judgement rather than pretending to
 * derive it.
 *
 * Carries no month, no period and no meter readings, and its lines carry no
 * period: a charge for an event has no span of time to report, and borrowing
 * the invoice's would invent a fact.
 *
 * Allowed against a finalized lease, and deliberately unguarded by any
 * one-per-lease rule — damage is usually found after the tenant has gone, and a
 * lost key in March and a broken window in July are two events.
 */
export async function issueAdhocInvoice(input: IssueAdhocInvoiceInput) {
  const lease = await prisma.lease.findUnique({ where: { id: input.leaseId } });
  if (!lease) {
    throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
  }

  const lines = input.charges.map((charge, index) => ({
    kind: "charge" as const,
    chargeCategory: charge.category,
    description: charge.description,
    // No basis to report: the amount IS the judgement, and a quantity of 1
    // would read as information without being any.
    quantity: null,
    unitAmount: null,
    amount: new Decimal(charge.amount).toDecimalPlaces(0),
    position: index + 1,
    periodStart: null,
    periodEnd: null,
  }));

  const totalAmount = lines.reduce((running, line) => running.add(line.amount), new Decimal(0));

  return prisma.invoice.create({
    data: {
      leaseId: lease.id,
      type: "adhoc",
      issueDate: input.issueDate ?? new Date(),
      totalAmount,
      lineItems: { create: lines },
    },
    include: invoiceInclude,
  });
}

export async function markPaid(id: number, input: MarkPaidInput) {
  const invoice = await findInvoiceOrThrow(id);

  if (invoice.voidedAt !== null) {
    throw new ConflictError("PAYMENT_ON_VOIDED_INVOICE", "Cannot record payment against a voided invoice");
  }
  if (invoice.paymentStatus === "paid") {
    throw new ConflictError("INVOICE_ALREADY_PAID", "That invoice has already been paid");
  }

  // The payment, the invoice's status and any holding it moves are written
  // together. An invoice recorded as paid whose payment was never written, or
  // whose deduction was not applied, would report the same money twice or lose
  // it entirely.
  return prisma.$transaction(async (tx) => {
    // Settling out of the deposit spends money the owner has held since the
    // tenancy began. Refused where the lease is not holding enough.
    if (input.paymentMethod === "deposit_deduction") {
      await deductFromDeposit(tx, invoice.leaseId, invoice.totalAmount);
    }

    // Whatever deposit this invoice charged becomes money held, now that it has
    // been paid. An invoice with no deposit line moves nothing.
    await holdFromInvoice(tx, invoice.leaseId, invoice.lineItems);

    await tx.payment.create({
      data: {
        invoiceId: id,
        amount: invoice.totalAmount,
        method: input.paymentMethod,
        paidAt: input.paidAt,
        state: "succeeded",
      },
    });

    return tx.invoice.update({
      where: { id },
      // Only the cached status. The method and the date live on the payment
      // written above — an invoice may carry several over its life, and a
      // column could only ever hold the last of them.
      data: { paymentStatus: "paid" },
      include: invoiceInclude,
    });
  });
}

/**
 * An issued invoice is a record of what was charged, so it is voided rather
 * than edited. The void frees the lease/month slot (the unique index ignores
 * voided rows) while keeping the original visible.
 *
 * A PAID invoice cannot be voided. Voiding removes a bill from every total
 * while the money paid for it stays where it is, leaving an owner holding cash
 * against a bill that no longer exists and nothing recording that they do. The
 * owner reverses the payment first, which hands the money back and returns the
 * invoice to pending; then it can be voided and reissued.
 *
 * Unwinding the deposit holdings an invoice moved is no longer done here — it
 * belongs to the reversal, and doing both would restore a holding twice.
 */
export async function voidInvoice(id: number, input: VoidInvoiceInput) {
  const invoice = await findInvoiceOrThrow(id);

  if (invoice.voidedAt !== null) {
    throw new ConflictError("INVOICE_ALREADY_VOIDED", "That invoice has already been voided");
  }
  if (invoice.paymentStatus === "paid") {
    throw new ConflictError(
      "INVOICE_VOID_AFTER_PAYMENT",
      "That invoice has been paid, so it cannot be voided. Reverse the payment first — voiding it now would leave the money paid for it unaccounted for",
    );
  }

  return prisma.invoice.update({
    where: { id },
    // Why, alongside when. A withdrawn bill carrying only a date cannot be
    // explained months later — least of all to the tenant asking about it.
    data: { voidedAt: new Date(), voidReason: input.reason },
    include: invoiceInclude,
  });
}
