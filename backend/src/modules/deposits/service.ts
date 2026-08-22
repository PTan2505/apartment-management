import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { mapPaginated, paginate, toSkipTake } from "@/lib/pagination.js";
import { adjustHolding } from "./holding.js";
import type { AdjustDepositInput, ListDepositsQuery, RefundDepositInput } from "./schema.js";

const Decimal = Prisma.Decimal;
const ZERO = () => new Decimal(0);

async function findLeaseOrThrow(id: number) {
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: {
      room: { select: { id: true, roomCode: true, buildingId: true } },
      occupants: {
        where: { isPrimary: true, leftAt: null },
        select: { user: { select: { id: true, fullName: true, phone: true } } },
      },
    },
  });
  if (!lease) {
    throw new NotFoundError("Lease not found");
  }
  return lease;
}

/**
 * What has already been taken out of this lease's deposit by settling bills
 * against it. Voided invoices are excluded: voiding one restores the holding,
 * so counting it here would report the same money as spent twice.
 */
async function deductedFromDeposit(leaseId: number) {
  const result = await prisma.payment.aggregate({
    where: {
      method: "deposit_deduction",
      // Reversed payments put the money back, so counting them would report
      // the deposit as spent on a bill it is no longer settling.
      state: "succeeded",
      invoice: { leaseId, voidedAt: null },
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? ZERO();
}

/**
 * The arithmetic the system knows, and deliberately no proposed figure.
 *
 * An owner deciding what to return needs to see what they hold and what they
 * have already taken; what they must not see is a number to accept by reflex,
 * because the deduction for a damaged room is theirs to judge and nothing here
 * can know about it.
 */
export async function getSettlement(leaseId: number) {
  const lease = await findLeaseOrThrow(leaseId);

  const unpaid = await prisma.invoice.aggregate({
    where: { leaseId, voidedAt: null, paymentStatus: "pending" },
    _sum: { totalAmount: true },
  });

  return {
    leaseId: lease.id,
    status: lease.moveOutDate === null ? "active" : "finalized",
    depositRequired: lease.baseRent.mul(lease.depositMonths),
    depositHeld: lease.depositHeld,
    depositCarriedIn: lease.depositCarriedIn,
    deductedFromDeposit: await deductedFromDeposit(lease.id),
    // Context, not an instruction: bills still owed are what an owner would
    // most likely settle from the deposit before returning the rest.
    outstandingInvoices: unpaid._sum.totalAmount ?? ZERO(),
    depositRefunded: lease.depositRefunded,
    depositRefundedAt: lease.depositRefundedAt,
  };
}

/**
 * Closing the holding by returning what the owner decided to return.
 *
 * Only for a tenancy that has ended — a running one has not finished with its
 * deposit — and only once. The holding goes to zero regardless of the amount
 * returned: whatever was not handed back was kept, and it is no longer held on
 * the tenant's behalf.
 */
export async function refundDeposit(leaseId: number, input: RefundDepositInput) {
  const lease = await findLeaseOrThrow(leaseId);

  if (lease.moveOutDate === null) {
    throw new ConflictError(
      "This tenancy is still running, so its deposit cannot be returned yet",
    );
  }
  if (lease.depositRefundedAt !== null) {
    throw new ConflictError("This lease's deposit has already been returned");
  }

  // The whole holding goes back. A holding of zero is a real case rather than
  // an error: a departing tenancy whose deposit was entirely spent on what it
  // owed still needs recording as settled, which is a different fact from a
  // deposit nobody has dealt with yet.
  await prisma.lease.update({
    where: { id: leaseId },
    data: {
      depositRefunded: lease.depositHeld,
      depositRefundedAt: input.refundedAt,
      depositHeld: ZERO(),
    },
  });

  return getSettlement(leaseId);
}

/**
 * Money added to or taken from a holding outside any invoice: a top-up
 * collected in cash at a renewal, a surplus handed back across a desk. Neither
 * is revenue nor an expense — it is the same money changing whose hands it is
 * in, and nothing the revenue report reads records it.
 */
export async function adjustDeposit(leaseId: number, input: AdjustDepositInput) {
  const lease = await findLeaseOrThrow(leaseId);

  if (lease.depositRefundedAt !== null) {
    throw new ConflictError(
      "This lease's deposit has already been returned, so there is no holding to adjust",
    );
  }

  const amount = new Decimal(input.amount).toDecimalPlaces(0);

  await prisma.$transaction(async (tx) => {
    await adjustHolding(tx, leaseId, amount);
  });

  return getSettlement(leaseId);
}

/**
 * What is held right now, per lease and in total.
 *
 * Deliberately not part of the revenue report: every figure there is a flow
 * through a month, and a holding is a balance at a moment. Putting one among
 * the others invites "deposits held in March" to be read as something that
 * happened in March.
 *
 * A deposit carried to a successor lease is already zero on the predecessor and
 * held on the successor, so it appears once without needing to be filtered.
 */
export async function listHeldDeposits(query: ListDepositsQuery) {
  const where: Prisma.LeaseWhereInput = {
    depositHeld: { gt: 0 },
    ...(query.buildingId ? { room: { buildingId: query.buildingId } } : {}),
  };

  const page = await paginate(
    query,
    prisma.lease.findMany({
      where,
      include: {
        room: {
          select: {
            id: true,
            roomCode: true,
            building: { select: { id: true, displayName: true } },
          },
        },
        occupants: {
          where: { isPrimary: true },
          orderBy: { joinedAt: "desc" },
          take: 1,
          select: { user: { select: { id: true, fullName: true, phone: true } } },
        },
      },
      orderBy: { id: "asc" },
      ...toSkipTake(query),
    }),
    prisma.lease.count({ where }),
  );

  // Summed across the whole selection, not the page: an owner asking what they
  // hold wants the figure for the buildings they asked about, not for whichever
  // twenty leases happen to be on screen.
  const total = await prisma.lease.aggregate({ where, _sum: { depositHeld: true } });

  return {
    ...mapPaginated(page, (lease) => ({
      leaseId: lease.id,
      status: lease.moveOutDate === null ? "active" : "finalized",
      room: { id: lease.room.id, roomCode: lease.room.roomCode },
      building: lease.room.building,
      tenant: lease.occupants[0]?.user ?? null,
      depositHeld: lease.depositHeld,
      depositRequired: lease.baseRent.mul(lease.depositMonths),
      depositCarriedIn: lease.depositCarriedIn,
    })),
    totalHeld: total._sum.depositHeld ?? ZERO(),
  };
}
