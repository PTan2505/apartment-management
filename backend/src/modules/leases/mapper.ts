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
 * How close to its end a tenancy has to be before it counts as due soon.
 *
 * Fourteen days: the window in which an owner still has time to ask whether the
 * tenant is staying and to look for another if not. Defined once, and used by
 * both the status below and the listing's order, so the two cannot disagree
 * about which tenancy is which.
 */
export const DUE_SOON_DAYS = 14;

/**
 * Six states, not three. Each distinction is one an owner acts on differently.
 *
 * A tenancy that never took place is not one that ran and ended: reporting them
 * alike presents as history something that never happened.
 *
 * And three states hid inside "active". A tenancy whose term ran out with no
 * move-out recorded still holds its room and can no longer be billed, while
 * reading as an ordinary running one. A tenancy ending next week read the same
 * as one ending next year. A tenancy signed for next month read as though
 * somebody were already living there.
 */
export type LeaseStatus =
  | "overdue"
  | "dueSoon"
  | "active"
  | "upcoming"
  | "finalized"
  | "cancelled";

/**
 * Derived from the dates rather than stored, which is what stops a status from
 * contradicting the rows it comes from — and here it is more than the usual
 * argument: every one of these is a question about TODAY. A tenancy moves from
 * active to due soon to overdue with nothing being written, so a stored column
 * would be wrong every morning until something touched it.
 *
 * Cancellation wins where both are somehow set. It cannot happen — cancelling
 * is refused on a lease that recorded a move-out, and vice versa — but a
 * precedence has to exist, and "never took place" is the stronger claim.
 */
export function leaseStatus(
  lease: {
    startDate: Date;
    durationMonths: number;
    moveOutDate: Date | null;
    cancelledAt: Date | null;
  },
  now: Date = new Date(),
): LeaseStatus {
  if (lease.cancelledAt !== null) {
    return "cancelled";
  }
  if (lease.moveOutDate !== null) {
    return "finalized";
  }
  if (lease.startDate > now) {
    return "upcoming";
  }

  // The term end is the first day NO LONGER covered, so a tenancy whose end is
  // today has already run out — the same exclusive reading billing uses.
  const termEnd = addMonths(lease.startDate, lease.durationMonths);
  if (termEnd <= now) {
    return "overdue";
  }
  const dueSoonFrom = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  return termEnd <= dueSoonFrom ? "dueSoon" : "active";
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
  electricityRate: Prisma.Decimal;
  waterRatePerPerson: Prisma.Decimal;
  depositMonths: number;
  depositHeld: Prisma.Decimal;
  depositCarriedIn: Prisma.Decimal;
  depositCarriedOut: Prisma.Decimal;
  depositRefunded: Prisma.Decimal | null;
  depositRefundedAt: Date | null;
  // How many pages of the signed contract are on file. Counted rather than
  // listed: a listing screen asks this per row, and the pages themselves are
  // fetched only when one tenancy is opened.
  pages?: { id: number }[];
  // A term of the agreement. Nullable, and null means NOT RECORDED.
  handoverSignedAt: Date | null;
  // Both ends of the renewal chain, present only where one exists.
  renewedFrom?: { id: number; reference: string | null } | null;
  renewedTo?: { id: number; reference: string | null } | null;
  reference: string | null;
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
    // The utility rates THIS tenancy was signed at, which are what its invoices
    // are computed from. Reported so a screen can show what a tenant is billed
    // at without reading the building, whose figures may since have changed.
    electricityRate: lease.electricityRate,
    waterRatePerPerson: lease.waterRatePerPerson,
    depositMonths: lease.depositMonths,
    /*
      A term of the agreement, reported exactly as stored.

      Null is passed through rather than filled in. A tenancy recorded from an
      old paper file may have no date anyone remembers, and a default would
      state as fact something nobody recorded, on a screen that reads as a
      contract.
    */
    handoverSignedAt: lease.handoverSignedAt,
    reference: lease.reference,
    /*
      Where this tenancy came from, and what it became.

      Reported as the agreement's name rather than its id, because a screen
      saying "renewed from #266" sends the reader to look up what #266 was.
      Null on a tenancy that was signed rather than renewed, and on one that has
      not been renewed — absent is the answer, not an omission.
    */
    renewedFrom: lease.renewedFrom ?? null,
    renewedTo: lease.renewedTo ?? null,
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
    /*
      Any tenancy that has not ended and was not already cancelled, and that has
      never been billed for a month it occupied.

      Written against the two facts rather than against `status === "active"`:
      once "active" split into four, that test silently excluded a tenancy
      signed for next month — the very case cancellation exists for — and an
      overdue one, which can also turn out never to have been moved into.
    */
    cancellable:
      lease.cancelledAt === null &&
      lease.moveOutDate === null &&
      (lease.invoices?.length ?? 0) === 0,
    /**
     * Whether the signed contract is on file — not WHERE it is.
     *
     * The key is an address in the owner's storage and reaches no caller: every
     * link to the file is signed at the moment it is asked for, and a key on a
     * screen would be an address with no way to open it and one more thing to
     * leak.
     */
    contractPageCount: lease.pages?.length ?? 0,
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
