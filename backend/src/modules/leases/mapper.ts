import type { Prisma } from "@/generated/prisma/client.js";

/**
 * Adds whole months to a date, clamping to the last valid day of the target
 * month. 31 January + 1 month is 28 (or 29) February, never 3 March — a naive
 * implementation rolls over into the following month.
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();

  // Move to the 1st first so adding months cannot itself roll over.
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(day, lastDayOfTargetMonth));
  return result;
}

export type LeaseStatus = "active" | "finalized";

interface OccupantRow {
  userId: number;
  isPrimary: boolean;
  leftAt: Date | null;
  user?: { id: number; fullName: string; phone: string | null } | null;
}

interface LeaseRow {
  id: number;
  roomId: number;
  startDate: Date;
  durationMonths: number;
  occupantCount: number;
  moveOutDate: Date | null;
  startMeterReading: number;
  endMeterReading: number | null;
  baseRent: Prisma.Decimal;
  depositMonths: number;
  depositHeld: Prisma.Decimal;
  depositCarriedIn: Prisma.Decimal;
  depositCarriedOut: Prisma.Decimal;
  depositRefunded: Prisma.Decimal | null;
  depositRefundedAt: Date | null;
  depositNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  occupants?: OccupantRow[];
}

/**
 * Shapes every lease response. expectedEndDate, status, and tenant are derived
 * here rather than stored, so they can never contradict the rows they come
 * from. Note occupantCount is NOT derived from occupants — it is a manually
 * maintained billing input and the two may legitimately differ (see design.md).
 */
export function toLeaseResponse(lease: LeaseRow) {
  const primary = lease.occupants?.find((o) => o.isPrimary && o.leftAt === null);

  return {
    id: lease.id,
    roomId: lease.roomId,
    startDate: lease.startDate,
    durationMonths: lease.durationMonths,
    expectedEndDate: addMonths(lease.startDate, lease.durationMonths),
    occupantCount: lease.occupantCount,
    baseRent: lease.baseRent,
    depositMonths: lease.depositMonths,
    // Derived, never stored. A stored amount could disagree with the two values
    // it comes from — a rent corrected after the fact would leave a deposit
    // matching neither the months agreed nor the rent agreed.
    //
    // Multiplied as Decimal rather than in floating point: this is money, and
    // the result is what an owner is holding on someone's behalf.
    depositAmount: lease.baseRent.mul(lease.depositMonths),
    // What is actually held, which is a different question from what the terms
    // agreed above. They differ the moment a deposit is carried over from a
    // previous tenancy, a move-in invoice goes unpaid, or a rent is raised at
    // renewal.
    depositHeld: lease.depositHeld,
    depositCarriedIn: lease.depositCarriedIn,
    depositCarriedOut: lease.depositCarriedOut,
    // Positive where the holding falls short of what the terms require,
    // negative where it exceeds them. Reported rather than left to be computed:
    // a shortfall nobody subtracted is a shortfall nobody noticed.
    depositDifference: lease.baseRent.mul(lease.depositMonths).sub(lease.depositHeld),
    depositRefunded: lease.depositRefunded,
    depositRefundedAt: lease.depositRefundedAt,
    depositNote: lease.depositNote,
    status: (lease.moveOutDate === null ? "active" : "finalized") satisfies LeaseStatus,
    tenant: primary
      ? {
          id: primary.userId,
          fullName: primary.user?.fullName ?? null,
          phone: primary.user?.phone ?? null,
        }
      : null,
    createdAt: lease.createdAt,
    updatedAt: lease.updatedAt,
  };
}

export function toOccupantResponse(occupant: OccupantRow & {
  id: number;
  joinedAt: Date;
}) {
  return {
    id: occupant.id,
    customerId: occupant.userId,
    fullName: occupant.user?.fullName ?? null,
    phone: occupant.user?.phone ?? null,
    isPrimary: occupant.isPrimary,
    joinedAt: occupant.joinedAt,
    leftAt: occupant.leftAt,
    status: occupant.leftAt === null ? "current" : "departed",
  };
}
