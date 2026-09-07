import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import {
  ConflictError,
  NotConfiguredError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors.js";
import * as storage from "@/lib/storage.js";
import type { ContractContentType } from "@/lib/storage.js";
import {
  issueFinalInvoice,
  issueMoveInInvoice,
  issueOverdueInvoice,
} from "@/modules/invoices/issue.js";
import { carryHolding, deductFromDeposit } from "@/modules/deposits/holding.js";
import { addMonths } from "./mapper.js";
import { HOLDS_ITS_ROOM } from "./occupancy.js";
import type {
  AddOccupantInput,
  CancelLeaseInput,
  CreateLeaseInput,
  ExtendLeaseInput,
  ListLeasesQuery,
  ListOccupantsQuery,
  UpdateLeaseInput,
} from "./schema.js";

const Decimal = Prisma.Decimal;

/**
 * A human-readable name for an agreement, generated from what it already holds.
 *
 * The room and the starting year say something a person recognises; the id
 * makes it unique without a retry loop, because it is unique before this runs.
 *
 * Never accepted from a caller. A typed reference drifts — two leases get the
 * same one, a typo makes one unfindable, and the field becomes a place people
 * write notes.
 *
 * The same shape the migration back-filled existing rows with, so a reference
 * written today and one written by the migration read alike.
 */
function buildLeaseReference(roomCode: string, startDate: Date, id: number): string {
  return `HD-${roomCode}-${startDate.getUTCFullYear()}-${id}`;
}

/**
 * What every lease response is built from.
 *
 * The room comes with it because a lease reporting only a room id cannot be
 * displayed — and fetching it per lease would mean a request per row of a
 * listing. Its building comes too: a room code identifies a room only within
 * its building.
 *
 * Only what identifies the room. Its rent is deliberately absent — the lease
 * carries its own agreed rent, and that is the figure this tenancy and its
 * deposit are governed by.
 */
const leaseInclude = {
  occupants: {
    include: { user: { select: { id: true, fullName: true, phone: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
  room: {
    select: {
      id: true,
      roomCode: true,
      building: { select: { id: true, displayName: true } },
    },
  },
  /**
   * Whether this tenancy has been billed for a month it occupied, fetched
   * alongside rather than asked for afterwards — the same shape as a room's
   * running tenancy, and for the same reason: a screen deciding whether to
   * offer cancellation would otherwise need a request per row of a listing.
   *
   * `take: 1` because the question is whether one exists.
   *
   * This never reaches a caller as rows. The mapper turns it into the fact and
   * the rule that follows from it, so the guard behind cancellation is stated
   * once in the service and reported, rather than restated in every client.
   */
  invoices: {
    where: { type: "monthly" as const, voidedAt: null },
    select: { id: true },
    take: 1,
  },
} as const;

/**
 * A cancelled tenancy never took place, so nothing that acts on the course of a
 * tenancy applies to it — no move-out, no renewal, no change to its terms or
 * its occupants. Refused in its own words rather than falling through to a
 * message about a finalized lease, which would tell the owner the wrong thing
 * about what happened to it.
 */
function assertNotCancelled(lease: { cancelledAt: Date | null }, what: string) {
  if (lease.cancelledAt !== null) {
    throw new ConflictError("LEASE_CANCELLED",
      `That tenancy was cancelled, so ${what}`);
  }
}

async function findLeaseOrThrow(id: number) {
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: leaseInclude,
  });
  if (!lease) {
    throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
  }
  return lease;
}

/**
 * A lease opens from its own meter reading rather than the room's latest, so a
 * new tenant is never charged for electricity used while the room stood empty.
 *
 * The room's latest known reading is always fetched, even when the owner
 * supplies one — the difference between the two is exactly the vacancy the
 * owner absorbs, so returning early on a supplied value would make it
 * uncomputable.
 */
async function resolveStartMeterReading(roomId: number, supplied?: number) {
  const latest = await findLatestKnownReading(roomId);

  if (supplied === undefined) {
    if (latest === null) {
      throw new ValidationError(
        "LEASE_START_METER_REQUIRED",
        "startMeterReading is required: this room has no previous reading to fall back on",
      );
    }
    return { startMeterReading: latest.reading, latestKnown: latest.reading };
  }

  return { startMeterReading: supplied, latestKnown: latest?.reading ?? null };
}

export async function createLease(input: CreateLeaseInput) {
  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    include: { building: true },
  });
  if (!room) {
    throw new NotFoundError("ROOM_NOT_FOUND", "Room not found");
  }
  if (!room.isActive) {
    throw new ValidationError("LEASE_ROOM_RETIRED", "Cannot create a lease for a retired room");
  }

  const signatory = await prisma.user.findFirst({
    where: { id: input.signatoryId, role: "customer" },
  });
  if (!signatory) {
    throw new NotFoundError("SIGNATORY_NOT_FOUND", "Signatory not found");
  }
  // A lease is a contract, so the person responsible for it must be contactable.
  if (!signatory.phone) {
    throw new ValidationError("SIGNATORY_PHONE_REQUIRED", "The lease signatory must have a phone number");
  }

  // First: is the room still let? This guard runs before the overlap check
  // below so a room with a running tenancy reports the reason the owner can
  // actually act on, rather than a date conflict against a lease that has no
  // ending date yet.
  const activeLease = await prisma.lease.findFirst({
    where: { roomId: input.roomId, ...HOLDS_ITS_ROOM },
  });
  if (activeLease) {
    throw new ConflictError("ROOM_ALREADY_LET", "That room already has an active lease");
  }

  // Then: does this tenancy begin before the last one finished?
  //
  // The guard above only ever asked whether an OPEN lease existed — it never
  // looked at dates. So a tenancy recorded as ending 5 July, followed by a
  // lease beginning 1 July, was accepted and both were billed for 1–4 July.
  //
  // The greatest ending date is the boundary, not the most recently created
  // lease: one entered out of order must not become the boundary. Every lease
  // on the room is closed at this point, so `moveOutDate` is present on all of
  // them and the latest is the day the room genuinely became free.
  //
  // Equality is allowed. An ending date is the first day no longer covered, so
  // a lease beginning exactly then abuts the previous one — no gap, no overlap.
  //
  // A CANCELLED tenancy is excluded from this comparison entirely rather than
  // having its dates compared. It covered no days, so there is nothing for a
  // new tenancy to overlap; treating its dates as occupied would block the very
  // room the cancellation was performed to free — and would do it silently,
  // reporting a date conflict against a tenancy that never happened.
  const lastEnded = await prisma.lease.findFirst({
    where: { roomId: input.roomId, cancelledAt: null, moveOutDate: { not: null } },
    orderBy: { moveOutDate: "desc" },
    select: { moveOutDate: true },
  });
  if (lastEnded?.moveOutDate && input.startDate < lastEnded.moveOutDate) {
    const earliest = lastEnded.moveOutDate.toISOString().slice(0, 10);
    throw new ConflictError(
      "LEASE_STARTS_BEFORE_PREVIOUS_END",
      `That room's previous tenancy ran until ${earliest}. A new lease cannot start before then — the earliest available date is ${earliest}.`,
    );
  }

  const { startMeterReading, latestKnown } = await resolveStartMeterReading(
    input.roomId,
    input.startMeterReading,
  );

  // Read once, here, and never again: the room's rent is what it asks of the
  // next tenant, and this lease is fixing its own. A later edit to the room
  // must not reach back into an agreement already made.
  const baseRent = input.baseRent ?? room.baseRent;

  // Any advance beyond the room's last known reading happened while nobody
  // lived there, so the owner absorbs it. A lower reading means the meter was
  // replaced — a new baseline, not a credit.
  const vacancyUnits =
    latestKnown !== null && startMeterReading > latestKnown
      ? startMeterReading - latestKnown
      : 0;

  // The lease and its primary occupant are written together so a lease never
  // exists without someone responsible for it.
  const lease = await prisma.$transaction(async (tx) => {
    const created = await tx.lease.create({
      data: {
        roomId: input.roomId,
        startDate: input.startDate,
        durationMonths: input.durationMonths,
        occupantCount: input.occupantCount,
        startMeterReading,
        baseRent,
        depositMonths: input.depositMonths,
        // Terms of the agreement. Absent stays absent — undefined leaves the
        // column null, which is what "not agreed" means here.
        noticeDays: input.noticeDays,
        paymentDay: input.paymentDay,
        startWaterReading: input.startWaterReading,
        handoverSignedAt: input.handoverSignedAt,
      },
    });

    /*
      The reference, set in the same transaction from facts the row now has.

      Built after the insert rather than before it because it includes the id,
      which is unique by construction — so the generator cannot collide with
      itself, needs no retry loop, and does not race with a concurrent creation.
      The unique index on the column is still what enforces it; this is what
      makes enforcement never fire.
    */
    await tx.lease.update({
      where: { id: created.id },
      data: { reference: buildLeaseReference(room.roomCode, created.startDate, created.id) },
    });

    await tx.leaseOccupant.create({
      data: {
        leaseId: created.id,
        userId: input.signatoryId,
        isPrimary: true,
        joinedAt: input.startDate,
      },
    });

    // The bill that starts the tenancy, written with the lease and its primary
    // occupant. A tenancy whose deposit was never charged is not a tenancy
    // anybody has actually started, so a failure here takes all three back.
    await issueMoveInInvoice(
      tx,
      {
        id: created.id,
        startDate: created.startDate,
        durationMonths: created.durationMonths,
        occupantCount: created.occupantCount,
        startMeterReading: created.startMeterReading,
        baseRent: created.baseRent,
        depositMonths: created.depositMonths,
        room: { buildingId: room.buildingId, building: room.building },
      },
      new Date(),
    );

    // Written in the same transaction: a lease that succeeded while its
    // vacancy cost failed would lose that cost with nothing to notice it by.
    if (vacancyUnits > 0 && latestKnown !== null) {
      const rate = room.building.electricityRate;
      await tx.expense.create({
        data: {
          buildingId: room.buildingId,
          roomId: room.id,
          category: "vacancy_electricity",
          origin: "system",
          reconciliation: "lease_start",
          description: `Vacancy electricity before lease start: ${vacancyUnits} kWh`,
          incurredAt: input.startDate,
          year: input.startDate.getUTCFullYear(),
          month: input.startDate.getUTCMonth() + 1,
          previousReading: latestKnown,
          currentReading: startMeterReading,
          quantity: vacancyUnits,
          unitRate: rate,
          amount: rate.mul(vacancyUnits).toDecimalPlaces(0),
        },
      });
    }

    return created;
  });

  return findLeaseOrThrow(lease.id);
}

/**
 * Leases whose agreed term has already run out while no move-out is recorded.
 *
 * The term end is not a column — it is `startDate + durationMonths`, derived in
 * the mapper rather than stored so it can never contradict the two values it
 * comes from. That means it cannot be compared in a Prisma filter, so the ids
 * are resolved here and fed back as an `in` clause, which leaves paging and the
 * other filters working through the normal path.
 *
 * The arithmetic is therefore expressed twice — `addMonths` in the mapper and
 * this interval in SQL — and the two must agree, including how each clamps a
 * month-end start. Checked against 31 January + 1 month (28 February), the leap
 * year case, and every other month-end boundary before this was written.
 *
 * `<=` rather than `<`: the term end is the first day no longer covered, so a
 * lease whose end is today has already run out.
 */
async function overdueLeaseIds(): Promise<number[]> {
  const rows = await prisma.$queryRawUnsafe<{ id: number }[]>(`
    SELECT id FROM "Lease"
    WHERE "moveOutDate" IS NULL
      AND "cancelledAt" IS NULL
      AND ("startDate" + ("durationMonths" || ' months')::interval) <= now()`);
  return rows.map((row) => row.id);
}

export async function listLeases(query: ListLeasesQuery) {
  // Resolved before the where clause is built, so it composes with every other
  // filter rather than replacing them.
  const overdueIds = query.overdue ? await overdueLeaseIds() : null;

  const where = {
    ...(query.roomId ? { roomId: query.roomId } : {}),
    // Narrows through the room rather than duplicating a building id onto the
    // lease. Combines with `roomId`: naming both is a room within a building,
    // which matches nothing if they disagree — correct, and better than
    // silently ignoring one of them.
    ...(query.buildingId ? { room: { buildingId: query.buildingId } } : {}),
    // "Active" is the running tenancies — which a cancelled one is not, so it
    // falls on the same side of this filter as one that ended.
    ...(query.active === undefined
      ? {}
      : query.active
        ? HOLDS_ITS_ROOM
        : { OR: [{ moveOutDate: { not: null } }, { cancelledAt: { not: null } }] }),
    // Matches any lease the person occupied, primary or not.
    ...(query.customerId ? { occupants: { some: { userId: query.customerId } } } : {}),
    ...(overdueIds === null ? {} : { id: { in: overdueIds } }),
  };

  return paginate(
    query,
    prisma.lease.findMany({
      where,
      include: leaseInclude,
      // Most recently begun first: the tenancy an owner has just signed, or is
      // about to act on, is the recent one. `createdAt` breaks a tie so the
      // order is TOTAL — without a tiebreak, two leases sharing a start date
      // have no defined order between them, and the database is free to return
      // them differently for each page. A row can then appear on two pages, or
      // on none.
      orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      ...toSkipTake(query),
    }),
    prisma.lease.count({ where }),
  );
}

export async function getLeaseById(id: number) {
  return findLeaseOrThrow(id);
}

export async function updateLease(id: number, input: UpdateLeaseInput) {
  const lease = await findLeaseOrThrow(id);

  assertNotCancelled(lease, "its terms can no longer be changed");
  if (lease.moveOutDate !== null) {
    throw new ConflictError("LEASE_FINALIZED_NOT_EDITABLE", "Cannot update a finalized lease");
  }

  await prisma.lease.update({ where: { id }, data: input });
  return findLeaseOrThrow(id);
}

/**
 * Renewing a tenancy: the predecessor closes on its agreed end date and a
 * successor opens the same day, carrying the deposit rather than charging it
 * again.
 *
 * The two are written together. A tenancy closed without its successor leaves a
 * room recorded as empty while somebody lives in it, and a successor opened
 * without its predecessor closing collides with the one-active-lease-per-room
 * rule.
 *
 * Closing behaves exactly as a move-out on the expected end date does, with one
 * deliberate exception: **no overdue invoice**. Overdue days are days nobody
 * agreed to — the tenancy ran on because neither party renewed. When the
 * parties DO renew, those same days were covered all along by the agreement
 * being signed; they are the successor's first days and its first month's rent
 * already pays for them. Issuing an overdue invoice would charge for days the
 * new lease also charges for.
 *
 * That is why a LATE extension is normalised rather than recorded as it
 * happened: whenever the owner gets round to entering it, the predecessor still
 * closes on its agreed end date and the successor still begins there. The
 * visible consequence is that an owner extending a month late finds the
 * successor already a month old, with a month of billing owed — which is
 * correct, because the tenancy was a month old.
 */
export async function extendLease(id: number, input: ExtendLeaseInput) {
  const lease = await findLeaseOrThrow(id);

  assertNotCancelled(lease, "there is no tenancy to renew");
  if (lease.moveOutDate !== null) {
    throw new ConflictError(
      "LEASE_EXTEND_AFTER_MOVE_OUT",
      "That lease has already recorded a move-out, so it cannot be extended",
    );
  }
  if (input.endMeterReading < lease.startMeterReading) {
    throw new ValidationError(
      "METER_BELOW_LEASE_START",
      "Closing meter reading cannot be below the reading this lease started from",
    );
  }

  const lastInvoice = await prisma.invoice.findFirst({
    where: { leaseId: id, voidedAt: null, currentElectricityUse: { not: null } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { currentElectricityUse: true },
  });
  if (
    lastInvoice?.currentElectricityUse != null &&
    input.endMeterReading < lastInvoice.currentElectricityUse
  ) {
    throw new ValidationError(
      "METER_BELOW_INVOICED",
      "Closing meter reading cannot be below the reading already invoiced for this lease",
    );
  }

  const room = await prisma.room.findUniqueOrThrow({
    where: { id: lease.roomId },
    include: { building: true },
  });

  // The hinge of the whole operation: where one tenancy stops and the next
  // begins. An ending date is the first day no longer covered, so the two abut
  // with neither a gap nor an overlap.
  const handover = addMonths(lease.startDate, lease.durationMonths);

  // Captured before the predecessor's occupancy records are closed, since
  // closing them is what makes them stop being current.
  const continuingOccupants = lease.occupants.filter((o) => o.leftAt === null);

  // The fees this tenancy still holds, re-priced at what the building asks
  // today. Carrying the old prices forward would make a rise unenforceable for
  // as long as a tenant keeps renewing.
  const carriedFees = await prisma.leaseServiceFee.findMany({
    where: {
      leaseId: id,
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: handover } }],
    },
    select: {
      quantity: true,
      buildingServiceFee: { select: { id: true, unitAmount: true, isActive: true } },
    },
    orderBy: { id: "asc" },
  });

  const baseRent = input.baseRent !== undefined ? new Decimal(input.baseRent) : room.baseRent;
  const depositMonths = input.depositMonths ?? lease.depositMonths;
  const occupantCount = input.occupantCount ?? lease.occupantCount;

  const carried = lease.depositHeld;
  const required = baseRent.mul(depositMonths).toDecimalPlaces(0);
  // Positive tops the holding up, negative hands part of it back, zero charges
  // nothing at all — the ordinary renewal on unchanged terms.
  const difference = required.sub(carried);

  const successorId = await prisma.$transaction(async (tx) => {
    // --- close the predecessor, exactly as a move-out does ---
    await tx.lease.update({
      where: { id },
      data: { moveOutDate: handover, endMeterReading: input.endMeterReading },
    });
    await tx.leaseOccupant.updateMany({
      where: { leaseId: id, leftAt: null },
      data: { leftAt: handover },
    });

    await issueFinalInvoice(
      tx,
      {
        id: lease.id,
        startDate: lease.startDate,
        durationMonths: lease.durationMonths,
        occupantCount: lease.occupantCount,
        startMeterReading: lease.startMeterReading,
        baseRent: lease.baseRent,
        depositMonths: lease.depositMonths,
        room: { buildingId: room.buildingId, building: room.building },
      },
      handover,
      input.endMeterReading,
      new Date(),
    );

    // No overdue invoice. Stated here rather than left to the dates coinciding:
    // the branch happens not to fire because the closing date IS the expected
    // end date, but that is arithmetic, not a decision.

    // --- open the successor ---
    const successor = await tx.lease.create({
      data: {
        roomId: lease.roomId,
        startDate: handover,
        durationMonths: input.durationMonths,
        occupantCount,
        // Exactly the predecessor's closing reading: nobody left, so there is
        // no vacancy for anyone to absorb.
        startMeterReading: input.endMeterReading,
        baseRent,
        depositMonths,
      },
    });

    for (const occupant of continuingOccupants) {
      await tx.leaseOccupant.create({
        data: {
          leaseId: successor.id,
          userId: occupant.userId,
          isPrimary: occupant.isPrimary,
          joinedAt: handover,
        },
      });
    }

    for (const fee of carriedFees) {
      // A fee the building has since retired is not re-offered. The predecessor
      // keeps its record of having held it; the renewal simply does not.
      if (!fee.buildingServiceFee.isActive) {
        continue;
      }
      await tx.leaseServiceFee.create({
        data: {
          leaseId: successor.id,
          buildingServiceFeeId: fee.buildingServiceFee.id,
          unitAmount: fee.buildingServiceFee.unitAmount,
          quantity: fee.quantity,
          effectiveFrom: handover,
        },
      });
    }

    // The deposit changes which tenancy it is held against, and nothing else.
    // No money moves, so the total across the two leases is unchanged.
    await carryHolding(tx, id, successor.id, carried);

    await issueMoveInInvoice(
      tx,
      {
        id: successor.id,
        startDate: successor.startDate,
        durationMonths: successor.durationMonths,
        occupantCount: successor.occupantCount,
        startMeterReading: successor.startMeterReading,
        baseRent: successor.baseRent,
        depositMonths: successor.depositMonths,
        room: { buildingId: room.buildingId, building: room.building },
      },
      new Date(),
      input.settleDepositOnInvoice
        ? {
            amount: difference,
            description: difference.isNegative()
              ? "Deposit returned on renewal"
              : "Deposit top-up on renewal",
          }
        : // Declining leaves the difference reported on the successor as a
          // shortfall or surplus, for the owner to settle in cash.
          { amount: new Decimal(0), description: "" },
    );

    return successor.id;
  });

  return {
    previous: await findLeaseOrThrow(id),
    lease: await findLeaseOrThrow(successorId),
  };
}

export async function recordMoveOut(
  id: number,
  moveOutDate: Date,
  endMeterReading: number,
  overdueCharges: { buildingServiceFeeId: number; amount: number }[] = [],
) {
  const lease = await findLeaseOrThrow(id);

  assertNotCancelled(lease, "nobody ever moved in to move out of");
  if (lease.moveOutDate !== null) {
    throw new ConflictError("LEASE_ALREADY_MOVED_OUT", "That lease has already recorded a move-out");
  }
  if (moveOutDate < lease.startDate) {
    throw new ValidationError("MOVE_OUT_BEFORE_START", "Move-out date cannot precede the lease start date");
  }
  if (endMeterReading < lease.startMeterReading) {
    throw new ValidationError(
      "METER_BELOW_LEASE_START",
      "Closing meter reading cannot be below the reading this lease started from",
    );
  }

  // The tenancy has already been billed up to its last invoice, so closing
  // below that point would contradict a bill already issued.
  // Only invoices that actually metered something. A move-in invoice charges a
  // deposit and rent and has no reading to compare against.
  const lastInvoice = await prisma.invoice.findFirst({
    where: { leaseId: id, voidedAt: null, currentElectricityUse: { not: null } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { currentElectricityUse: true },
  });
  if (lastInvoice?.currentElectricityUse != null && endMeterReading < lastInvoice.currentElectricityUse) {
    throw new ValidationError(
      "METER_BELOW_INVOICED",
      "Closing meter reading cannot be below the reading already invoiced for this lease",
    );
  }

  const room = await prisma.room.findUniqueOrThrow({
    where: { id: lease.roomId },
    include: { building: true },
  });
  const expectedEndDate = addMonths(lease.startDate, lease.durationMonths);
  const forIssue = {
    id: lease.id,
    startDate: lease.startDate,
    durationMonths: lease.durationMonths,
    occupantCount: lease.occupantCount,
    startMeterReading: lease.startMeterReading,
    baseRent: lease.baseRent,
    depositMonths: lease.depositMonths,
    room: { buildingId: room.buildingId, building: room.building },
  };

  // Finalizing the lease also closes its occupancy records, so nobody is left
  // recorded as living in a room that is no longer let, and issues the closing
  // bill. A tenancy closed without its last month billed loses that money
  // silently, so a failure anywhere here takes the whole move-out back.
  await prisma.$transaction(async (tx) => {
    await tx.lease.update({ where: { id }, data: { moveOutDate, endMeterReading } });
    await tx.leaseOccupant.updateMany({
      where: { leaseId: id, leftAt: null },
      data: { leftAt: moveOutDate },
    });

    await issueFinalInvoice(tx, forIssue, moveOutDate, endMeterReading, new Date());

    // Days beyond the agreed term get their own bill, because no agreement
    // covers them and nothing can be calculated for them. Issued even when the
    // owner names no charges: waiving the days should leave a record saying so.
    if (moveOutDate > expectedEndDate) {
      await issueOverdueInvoice(tx, forIssue, moveOutDate, overdueCharges, new Date());
    }
  });

  return findLeaseOrThrow(id);
}

/**
 * Recording that a tenancy never took place — which is a different event from
 * one ending, and is deliberately not expressible as one.
 *
 * A move-out closes a tenancy that happened: it takes a closing meter reading,
 * bills a final month, and prorates the days occupied. A tenant who signed in
 * advance and then backed out gives it none of those, and the move-out rightly
 * refuses both sensible dates — before the start, and on it. Before this
 * existed those two refusals were the whole of the system's answer, and the
 * lease was stuck permanently: its room held, its move-in invoice outstanding,
 * nothing correctable.
 *
 * What becomes of the money is the owner's decision and not a calculation.
 * Nothing in the record says whether a tenant who changed their mind gets their
 * deposit back; that is between the two of them, and this only writes down what
 * they agreed.
 */
export async function cancelLease(id: number, input: CancelLeaseInput) {
  const lease = await findLeaseOrThrow(id);

  if (lease.cancelledAt !== null) {
    throw new ConflictError("LEASE_ALREADY_CANCELLED", "That lease has already been cancelled");
  }
  if (lease.moveOutDate !== null) {
    throw new ConflictError(
      "LEASE_CANCEL_AFTER_MOVE_OUT",
      "That tenancy has recorded a move-out, so it cannot be recorded as never having taken place",
    );
  }

  // A monthly invoice is the point past which a tenancy has demonstrably been
  // lived in and billed for. Unwinding one of those is a larger problem —
  // issued invoices, possibly paid, possibly metered — and this guard exists so
  // it is not attempted by accident.
  //
  // The MOVE-IN invoice deliberately does not count, though it charges the
  // first month's rent alongside the deposit. Every lease has one from the
  // moment it is created, so counting it would make cancellation impossible for
  // every tenancy that has ever collected a deposit — which is every tenancy
  // this feature exists for.
  const billedMonth = await prisma.invoice.findFirst({
    where: { leaseId: id, type: "monthly", voidedAt: null },
    select: { id: true },
  });
  if (billedMonth) {
    throw new ConflictError(
      "LEASE_CANCEL_AFTER_BILLING",
      "That tenancy has been billed for a month, so it cannot be recorded as never having taken place. Record a move-out instead",
    );
  }

  const held = lease.depositHeld;
  const returned = new Decimal(input.depositReturned ?? 0).toDecimalPlaces(0);
  const kept = new Decimal(input.depositKept ?? 0).toDecimalPlaces(0);

  if (held.isZero()) {
    // Nothing was collected, so there is nothing to divide. Naming amounts
    // anyway is refused rather than ignored: an owner who thinks they are
    // handing back money should not be told the cancellation succeeded.
    if (!returned.isZero() || !kept.isZero()) {
      throw new ValidationError(
        "DEPOSIT_NONE_HELD",
        "This tenancy is holding no deposit, so there is nothing to return or keep",
      );
    }
  } else {
    if (input.depositReturned === undefined || input.depositKept === undefined) {
      throw new ValidationError(
        "DEPOSIT_SPLIT_REQUIRED",
        "State how much of the deposit is returned and how much is kept",
      );
    }
    // Settled against the holding AS A WHOLE, not per charge. The owner took
    // one payment and will hand back one amount; asking them to apportion it
    // between the deposit and the first month's rent would be asking them to
    // reconstruct a distinction they never made.
    if (!returned.add(kept).equals(held)) {
      throw new ValidationError(
        "DEPOSIT_SPLIT_MISMATCH",
      `Returned and kept must account for the whole deposit of ${held.toFixed(0)} held against this tenancy — they come to ${returned.add(kept).toFixed(0)}`,
      );
    }
  }

  const cancelledAt = input.cancelledAt ?? new Date();

  // One transaction. A lease cancelled while its holding survived would report
  // money held on behalf of a tenancy that does not exist, and a holding closed
  // without the cancellation would lose the deposit with nothing to notice it
  // by.
  await prisma.$transaction(async (tx) => {
    // An unpaid bill for a tenancy that never happened counts a debt nobody
    // owes, in every report from now on. Voiding is already the operation for
    // an invoice that should not have been issued, and it is permitted here
    // precisely because nothing was paid against it.
    //
    // No holding is released alongside: a holding only ever comes from an
    // invoice that was PAID, and those are not touched here.
    //
    // Recorded with its own reason, in the same column an owner's void writes
    // to. A withdrawal nobody performed deliberately needs explaining MORE than
    // one that was, not less — and a second place to record the same fact would
    // only compete with the first.
    await tx.invoice.updateMany({
      where: { leaseId: id, voidedAt: null, paymentStatus: "pending" },
      data: {
        voidedAt: cancelledAt,
        voidReason: "The tenancy was cancelled — it never took place",
      },
    });

    // What the owner keeps is recorded through the machinery that already
    // exists: an ad-hoc invoice carrying an owner-named charge, settled out of
    // the deposit. The revenue report counts `charge` lines as revenue and
    // excludes `deposit` ones, so nothing there needs teaching — and teaching
    // it would mean a second path into the same total, which is how a total
    // stops adding up.
    //
    // Issued dated the cancellation, so it lands in the month the owner gave
    // up. Created AFTER the void above, so it is not caught by it.
    if (!kept.isZero()) {
      const invoice = await tx.invoice.create({
        data: {
          leaseId: id,
          type: "adhoc",
          issueDate: cancelledAt,
          totalAmount: kept,
          lineItems: {
            create: [
              {
                kind: "charge",
                chargeCategory: "penalty",
                description: "Deposit kept on cancellation",
                // No basis to report: the amount IS the decision, and a
                // quantity of 1 would read as information without being any.
                quantity: null,
                unitAmount: null,
                amount: kept,
                position: 1,
                periodStart: null,
                periodEnd: null,
              },
            ],
          },
        },
      });

      // The money reached the owner months ago; this records that it has
      // stopped being the tenant's. Written exactly as `markPaid` writes a
      // deposit deduction, because it is one.
      await deductFromDeposit(tx, id, kept);
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: kept,
          method: "deposit_deduction",
          paidAt: cancelledAt,
          state: "succeeded",
        },
      });
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { paymentStatus: "paid" },
      });
    }

    await tx.lease.update({
      where: { id },
      data: {
        cancelledAt,
        // Whatever was not kept goes back, and the holding closes either way.
        // Nothing is recorded for the returned amount beyond this: it is the
        // tenant's own money going back, which this system already treats as
        // changing whose hands money is in rather than as earning.
        //
        // Untouched where nothing was held — writing a refund of zero would
        // claim a settlement that never took place.
        ...(held.isZero()
          ? {}
          : { depositHeld: new Decimal(0), depositRefunded: returned, depositRefundedAt: cancelledAt }),
      },
    });
  });

  return findLeaseOrThrow(id);
}

/**
 * The signed contract for a tenancy.
 *
 * Evidence attached to the record, not part of it: nothing here is read by any
 * rule and no reported value derives from it. A tenancy with no contract
 * behaves in every other way like one that has it.
 */

function assertStorage() {
  if (!storage.isConfigured()) {
    throw new NotConfiguredError(
      "CONTRACT_STORAGE_NOT_CONFIGURED",
      "Contract storage is not configured on this server, so contracts cannot be kept here",
    );
  }
}

/**
 * A URL that uploads one contract, straight to storage.
 *
 * The caller names a content type, never a destination. The key is derived from
 * the tenancy and a random component, so a URL obtained for one tenancy cannot
 * be turned into a write anywhere else — and a replacement never reuses a key,
 * which would let a browser or a CDN serve the previous contract for the new
 * one.
 */
export async function signContractUpload(id: number, contentType: ContractContentType) {
  await findLeaseOrThrow(id);
  assertStorage();
  return storage.signContractUpload(id, contentType);
}

/**
 * Records the contract, once storage confirms it is really there.
 *
 * A signed URL is handed out BEFORE anything is uploaded, and the upload can
 * fail after it: a closed tab, a dropped connection, a file storage rejected.
 * Recording at signing time would leave tenancies claiming a contract that does
 * not exist, and nothing would ever notice.
 */
export async function confirmContractUpload(id: number, key: string) {
  const lease = await findLeaseOrThrow(id);
  assertStorage();

  // The key is checked against this tenancy's own prefix rather than trusted.
  // Without this, a confirmation could attach another tenancy's contract — or
  // any object in the bucket — to this one.
  if (!key.startsWith(storage.contractPrefix(id))) {
    throw new ValidationError("CONTRACT_KEY_FOREIGN", "That file does not belong to this tenancy");
  }

  const object = await storage.describeObject(key);
  if (object === null) {
    throw new ValidationError(
      "CONTRACT_OBJECT_MISSING",
      "That file is not in storage. The upload may not have finished — try again",
    );
  }

  // A size cannot be bound into a presigned PUT the way a content type can, so
  // it is enforced here, before anything is recorded. The oversized object is
  // DELETED: one nobody can reach through the application is one nobody will
  // ever clear.
  if (object.size > storage.MAX_CONTRACT_BYTES) {
    await storage.deleteObject(key);
    throw new ValidationError(
      "CONTRACT_FILE_TOO_LARGE",
      `That file is larger than the ${Math.round(storage.MAX_CONTRACT_BYTES / 1024 / 1024)} MB limit`,
    );
  }

  await prisma.lease.update({ where: { id }, data: { contractKey: key } });

  // Everything else under this tenancy's prefix goes: the contract being
  // replaced, and any upload that reached storage and was never confirmed.
  //
  // This used to delete only the PREVIOUS contract, which caught a replacement
  // and never an abandoned upload — and abandoned uploads accumulate, since
  // nothing else ever removes them. Found by running the feature against a real
  // bucket, not while designing it.
  //
  // After the record is written, so a failure leaves the tenancy with a
  // contract rather than none. And swallowed: the record is what the
  // application reads, and reporting a successful confirmation as a failure
  // would invite the owner to repeat an upload that already worked.
  await storage.clearPrefixExcept(storage.contractPrefix(id), key).catch(() => {});

  return findLeaseOrThrow(id);
}

export async function getContractDownload(id: number) {
  const lease = await findLeaseOrThrow(id);
  assertStorage();
  if (lease.contractKey === null) {
    throw new NotFoundError("CONTRACT_NONE_ON_FILE", "This tenancy has no contract on file");
  }
  return storage.signContractDownload(lease.contractKey);
}

export async function removeContract(id: number) {
  const lease = await findLeaseOrThrow(id);
  assertStorage();
  if (lease.contractKey === null) {
    throw new NotFoundError("CONTRACT_NONE_ON_FILE", "This tenancy has no contract on file");
  }

  await prisma.lease.update({ where: { id }, data: { contractKey: null } });
  // Keeping nothing: the contract itself and any abandoned upload beside it.
  await storage.clearPrefixExcept(storage.contractPrefix(id), null).catch(() => {});

  return findLeaseOrThrow(id);
}

export async function listOccupants(leaseId: number, query: ListOccupantsQuery) {
  await findLeaseOrThrow(leaseId);
  const where = { leaseId };

  return paginate(
    query,
    prisma.leaseOccupant.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, phone: true } } },
      orderBy: { joinedAt: "asc" },
      ...toSkipTake(query),
    }),
    prisma.leaseOccupant.count({ where }),
  );
}

export async function addOccupant(leaseId: number, input: AddOccupantInput) {
  const lease = await findLeaseOrThrow(leaseId);

  assertNotCancelled(lease, "nobody can be recorded as living there");
  if (lease.moveOutDate !== null) {
    throw new ConflictError("OCCUPANT_ADD_TO_FINALIZED", "Cannot add an occupant to a finalized lease");
  }

  const customer = await prisma.user.findFirst({
    where: { id: input.customerId, role: "customer" },
  });
  if (!customer) {
    throw new NotFoundError("CUSTOMER_NOT_FOUND", "Customer not found");
  }

  const alreadyCurrent = lease.occupants.find(
    (o) => o.userId === input.customerId && o.leftAt === null,
  );
  if (alreadyCurrent) {
    throw new ConflictError("OCCUPANT_ALREADY_PRESENT", "That person is already a current occupant of this lease");
  }

  // A person who previously departed gets a fresh record; the earlier one is
  // retained as history.
  const occupant = await prisma.leaseOccupant.create({
    data: {
      leaseId,
      userId: input.customerId,
      isPrimary: false,
      joinedAt: input.joinedAt ?? new Date(),
    },
    include: { user: { select: { id: true, fullName: true, phone: true } } },
  });

  return occupant;
}

export async function departOccupant(
  leaseId: number,
  occupantId: number,
  leftAt: Date,
) {
  const lease = await findLeaseOrThrow(leaseId);
  const occupant = lease.occupants.find((o) => o.id === occupantId);

  if (!occupant) {
    throw new NotFoundError("OCCUPANT_NOT_ON_LEASE", "Occupant not found on this lease");
  }
  if (occupant.leftAt !== null) {
    throw new ConflictError("OCCUPANT_ALREADY_DEPARTED", "That occupant has already departed");
  }
  if (leftAt < occupant.joinedAt) {
    throw new ValidationError("DEPARTURE_BEFORE_JOIN", "Departure date cannot precede the date they joined");
  }

  const otherCurrent = lease.occupants.filter(
    (o) => o.leftAt === null && o.id !== occupantId,
  );
  // Responsibility must be handed over first, otherwise the lease would be left
  // with occupants but nobody accountable. If they are the last occupant there
  // is nobody to transfer to, so the departure is allowed.
  if (occupant.isPrimary && otherCurrent.length > 0) {
    throw new ConflictError(
      "PRIMARY_OCCUPANT_MUST_TRANSFER",
      "Transfer primary responsibility to another occupant before recording this departure",
    );
  }

  return prisma.leaseOccupant.update({
    where: { id: occupantId },
    data: { leftAt },
    include: { user: { select: { id: true, fullName: true, phone: true } } },
  });
}

export async function transferPrimary(leaseId: number, customerId: number) {
  const lease = await findLeaseOrThrow(leaseId);

  assertNotCancelled(lease, "there is no responsibility left to transfer");
  if (lease.moveOutDate !== null) {
    throw new ConflictError("TRANSFER_ON_FINALIZED_LEASE", "Cannot transfer responsibility on a finalized lease");
  }

  const incoming = lease.occupants.find(
    (o) => o.userId === customerId && o.leftAt === null,
  );
  if (!incoming) {
    throw new ValidationError("TRANSFER_TARGET_NOT_OCCUPANT", "That person is not a current occupant of this lease");
  }

  const current = lease.occupants.find((o) => o.isPrimary && o.leftAt === null);
  if (current && current.id === incoming.id) {
    throw new ConflictError("TRANSFER_TARGET_ALREADY_PRIMARY", "That person is already the primary occupant");
  }

  // Clear the existing primary before setting the new one: the partial unique
  // index permits only one active primary at a time.
  await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.leaseOccupant.update({
        where: { id: current.id },
        data: { isPrimary: false },
      });
    }
    await tx.leaseOccupant.update({
      where: { id: incoming.id },
      data: { isPrimary: true },
    });
  });

  return findLeaseOrThrow(leaseId);
}

/** Used by the rooms and buildings retire guards. */
export async function roomHasActiveLease(roomId: number) {
  const lease = await prisma.lease.findFirst({
    where: { roomId, ...HOLDS_ITS_ROOM },
    select: { id: true },
  });
  return lease !== null;
}

export async function buildingHasActiveLease(buildingId: number) {
  const lease = await prisma.lease.findFirst({
    where: { ...HOLDS_ITS_ROOM, room: { buildingId } },
    select: { id: true },
  });
  return lease !== null;
}
