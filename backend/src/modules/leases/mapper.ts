import type { Prisma } from "@/generated/prisma/client.js";
import { isConfigured as contractStorageConfigured } from "@/lib/storage.js";

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

/**
 * Three states, not two. A tenancy that never took place is not one that ran
 * and ended: reporting them alike presents as history something that never
 * happened, inflating how many tenancies a room has had and how many a person
 * has held.
 */
export type LeaseStatus = "active" | "finalized" | "cancelled";

/**
 * Derived from the two dates rather than stored, which is what stops a status
 * from contradicting the rows it comes from.
 *
 * Cancellation wins where both are somehow set. It cannot happen — cancelling
 * is refused on a lease that recorded a move-out, and vice versa — but a
 * precedence has to exist, and "never took place" is the stronger claim.
 */
export function leaseStatus(lease: {
  moveOutDate: Date | null;
  cancelledAt: Date | null;
}): LeaseStatus {
  if (lease.cancelledAt !== null) {
    return "cancelled";
  }
  return lease.moveOutDate === null ? "active" : "finalized";
}

interface OccupantRow {
  userId: number;
  isPrimary: boolean;
  leftAt: Date | null;
  user?: { id: number; fullName: string; phone: string | null } | null;
}

/**
 * The room a lease is for, limited to what identifies it.
 *
 * A room code identifies a room only within its building, so the building comes
 * with it — the same reason a room carries its own building rather than a bare
 * id.
 *
 * Deliberately no rent, status, or occupancy. The lease has its own agreed rent,
 * which is the figure that governs this tenancy and its deposit; putting the
 * room's current rent beside it on the same object is how the wrong one gets
 * read. Occupancy would be circular — this lease is the reason the room is let.
 */
interface LeaseRoomRow {
  id: number;
  roomCode: string;
  building?: { id: number; displayName: string } | null;
}

interface LeaseRow {
  id: number;
  roomId: number;
  room?: LeaseRoomRow | null;
  startDate: Date;
  durationMonths: number;
  occupantCount: number;
  moveOutDate: Date | null;
  cancelledAt: Date | null;
  startMeterReading: number;
  endMeterReading: number | null;
  baseRent: Prisma.Decimal;
  depositMonths: number;
  depositHeld: Prisma.Decimal;
  depositCarriedIn: Prisma.Decimal;
  depositCarriedOut: Prisma.Decimal;
  depositRefunded: Prisma.Decimal | null;
  depositRefundedAt: Date | null;
  contractKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  occupants?: OccupantRow[];
  /** Monthly invoices issued against this tenancy, fetched capped at one. */
  invoices?: { id: number }[];
}

/**
 * Shapes every lease response. expectedEndDate, status, and tenant are derived
 * here rather than stored, so they can never contradict the rows they come
 * from. Note occupantCount is NOT derived from occupants — it is a manually
 * maintained billing input and the two may legitimately differ (see design.md).
 */
export function toLeaseResponse(lease: LeaseRow) {
  /**
   * Who answers for this agreement — and, once it is over, who answered for it.
   *
   * Recording a move-out departs every occupant, so a finished tenancy has no
   * CURRENT primary and reported no tenant at all. That erased the one name the
   * record exists to hold: months later the question asked of a closed tenancy
   * is "who was renting this", and the answer was gone.
   *
   * The fallback is restricted to a finished tenancy on purpose. On a RUNNING
   * one, no current primary means the last occupant left before a move-out was
   * recorded and nobody is answerable right now — a real problem that needs
   * showing, not papering over with the name of somebody who has left. Falling
   * back everywhere would hide exactly the case worth surfacing.
   *
   * Exactly one occupant carries `isPrimary` at a time (a transfer moves it),
   * so on a finished tenancy this finds the person who held it at the end.
   */
  const currentPrimary = lease.occupants?.find((o) => o.isPrimary && o.leftAt === null);
  const status = leaseStatus(lease);
  const primary =
    currentPrimary ??
    (status !== "active" ? lease.occupants?.find((o) => o.isPrimary) : undefined);

  return {
    id: lease.id,
    roomId: lease.roomId,
    // Kept alongside `roomId`, so callers reading the id are unaffected.
    room: lease.room
      ? {
          id: lease.room.id,
          roomCode: lease.room.roomCode,
          building: lease.room.building
            ? { id: lease.room.building.id, displayName: lease.room.building.displayName }
            : null,
        }
      : null,
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
    /**
     * Exclusive, exactly like `expectedEndDate` above: the first day the
     * tenancy no longer covers. The two are reported on the same convention
     * deliberately — one of each would eventually be read as the other.
     *
     * Reported rather than left to `status`, which says a tenancy is over
     * without saying when, and so cannot distinguish one that ran its agreed
     * term from one closed early or late. That distinction is why a move-out
     * date is deliberately unconstrained by the term in the first place.
     */
    moveOutDate: lease.moveOutDate,
    /**
     * When the owner recorded that this tenancy never took place. Reported
     * beside `moveOutDate` rather than folded into it, because the two are
     * different events and a reader needs to be able to tell which happened.
     *
     * Deliberately NOT an ending date. `moveOutDate` and `expectedEndDate` are
     * both exclusive bounds on days the tenancy covered; a cancelled tenancy
     * covered none, so this date bounds nothing and must never be read as if
     * it did.
     */
    cancelledAt: lease.cancelledAt,
    status,
    /**
     * Whether this tenancy has been billed for a month it occupied — the fact
     * behind `cancellable` below, reported alongside it so a caller withholding
     * the action can say WHY rather than leaving an owner hunting for a control
     * that is not there.
     */
    hasBilledMonth: (lease.invoices?.length ?? 0) > 0,
    /**
     * Whether this tenancy can be recorded as never having taken place.
     *
     * Reported rather than left for each caller to work out, because working it
     * out means restating the service's guard — and a rule stated in two places
     * is a rule that will eventually be enforced in one of them only. A screen
     * that offers an action the API refuses is the visible half of that; the
     * invisible half is a screen that hides one the API would have allowed.
     */
    cancellable:
      status === "active" && (lease.invoices?.length ?? 0) === 0,
    /**
     * Whether the signed contract is on file — not WHERE it is.
     *
     * The key is an address in the owner's storage and reaches no caller: every
     * link to the file is signed at the moment it is asked for, and a key on a
     * screen would be an address with no way to open it and one more thing to
     * leak.
     */
    hasContract: lease.contractKey !== null,
    /**
     * Whether this deployment can keep contracts at all.
     *
     * Reported so a screen can say storage is unconfigured INSTEAD of offering
     * an upload that will fail — finding out by having an action refused is
     * finding out at the worst moment, and the server knows before it is asked.
     *
     * A pure read of configuration, so it costs no query and every lease can
     * carry it.
     */
    contractStorageAvailable: contractStorageConfigured(),
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
