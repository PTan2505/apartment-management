import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import {
  issueFinalInvoice,
  issueMoveInInvoice,
  issueOverdueInvoice,
} from "@/modules/invoices/issue.js";
import { addMonths } from "./mapper.js";
import type {
  AddOccupantInput,
  CreateLeaseInput,
  ListLeasesQuery,
  ListOccupantsQuery,
  UpdateLeaseInput,
} from "./schema.js";

const occupantInclude = {
  occupants: {
    include: { user: { select: { id: true, fullName: true, phone: true } } },
    orderBy: { joinedAt: "asc" as const },
  },
} as const;

async function findLeaseOrThrow(id: number) {
  const lease = await prisma.lease.findUnique({
    where: { id },
    include: occupantInclude,
  });
  if (!lease) {
    throw new NotFoundError("Lease not found");
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
    throw new NotFoundError("Room not found");
  }
  if (!room.isActive) {
    throw new ValidationError("Cannot create a lease for a retired room");
  }

  const signatory = await prisma.user.findFirst({
    where: { id: input.signatoryId, role: "customer" },
  });
  if (!signatory) {
    throw new NotFoundError("Signatory not found");
  }
  // A lease is a contract, so the person responsible for it must be contactable.
  if (!signatory.phone) {
    throw new ValidationError("The lease signatory must have a phone number");
  }

  // First: is the room still let? This guard runs before the overlap check
  // below so a room with a running tenancy reports the reason the owner can
  // actually act on, rather than a date conflict against a lease that has no
  // ending date yet.
  const activeLease = await prisma.lease.findFirst({
    where: { roomId: input.roomId, moveOutDate: null },
  });
  if (activeLease) {
    throw new ConflictError("That room already has an active lease");
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
  const lastEnded = await prisma.lease.findFirst({
    where: { roomId: input.roomId, moveOutDate: { not: null } },
    orderBy: { moveOutDate: "desc" },
    select: { moveOutDate: true },
  });
  if (lastEnded?.moveOutDate && input.startDate < lastEnded.moveOutDate) {
    const earliest = lastEnded.moveOutDate.toISOString().slice(0, 10);
    throw new ConflictError(
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
      },
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
      AND ("startDate" + ("durationMonths" || ' months')::interval) <= now()`);
  return rows.map((row) => row.id);
}

export async function listLeases(query: ListLeasesQuery) {
  // Resolved before the where clause is built, so it composes with every other
  // filter rather than replacing them.
  const overdueIds = query.overdue ? await overdueLeaseIds() : null;

  const where = {
    ...(query.roomId ? { roomId: query.roomId } : {}),
    ...(query.active === undefined
      ? {}
      : query.active
        ? { moveOutDate: null }
        : { moveOutDate: { not: null } }),
    // Matches any lease the person occupied, primary or not.
    ...(query.customerId ? { occupants: { some: { userId: query.customerId } } } : {}),
    ...(overdueIds === null ? {} : { id: { in: overdueIds } }),
  };

  return paginate(
    query,
    prisma.lease.findMany({
      where,
      include: occupantInclude,
      orderBy: { createdAt: "asc" },
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

  if (lease.moveOutDate !== null) {
    throw new ConflictError("Cannot update a finalized lease");
  }

  await prisma.lease.update({ where: { id }, data: input });
  return findLeaseOrThrow(id);
}

export async function recordMoveOut(
  id: number,
  moveOutDate: Date,
  endMeterReading: number,
  overdueCharges: { buildingServiceFeeId: number; amount: number }[] = [],
) {
  const lease = await findLeaseOrThrow(id);

  if (lease.moveOutDate !== null) {
    throw new ConflictError("That lease has already recorded a move-out");
  }
  if (moveOutDate < lease.startDate) {
    throw new ValidationError("Move-out date cannot precede the lease start date");
  }
  if (endMeterReading < lease.startMeterReading) {
    throw new ValidationError(
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

  if (lease.moveOutDate !== null) {
    throw new ConflictError("Cannot add an occupant to a finalized lease");
  }

  const customer = await prisma.user.findFirst({
    where: { id: input.customerId, role: "customer" },
  });
  if (!customer) {
    throw new NotFoundError("Customer not found");
  }

  const alreadyCurrent = lease.occupants.find(
    (o) => o.userId === input.customerId && o.leftAt === null,
  );
  if (alreadyCurrent) {
    throw new ConflictError("That person is already a current occupant of this lease");
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
    throw new NotFoundError("Occupant not found on this lease");
  }
  if (occupant.leftAt !== null) {
    throw new ConflictError("That occupant has already departed");
  }
  if (leftAt < occupant.joinedAt) {
    throw new ValidationError("Departure date cannot precede the date they joined");
  }

  const otherCurrent = lease.occupants.filter(
    (o) => o.leftAt === null && o.id !== occupantId,
  );
  // Responsibility must be handed over first, otherwise the lease would be left
  // with occupants but nobody accountable. If they are the last occupant there
  // is nobody to transfer to, so the departure is allowed.
  if (occupant.isPrimary && otherCurrent.length > 0) {
    throw new ConflictError(
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

  if (lease.moveOutDate !== null) {
    throw new ConflictError("Cannot transfer responsibility on a finalized lease");
  }

  const incoming = lease.occupants.find(
    (o) => o.userId === customerId && o.leftAt === null,
  );
  if (!incoming) {
    throw new ValidationError("That person is not a current occupant of this lease");
  }

  const current = lease.occupants.find((o) => o.isPrimary && o.leftAt === null);
  if (current && current.id === incoming.id) {
    throw new ConflictError("That person is already the primary occupant");
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
    where: { roomId, moveOutDate: null },
    select: { id: true },
  });
  return lease !== null;
}

export async function buildingHasActiveLease(buildingId: number) {
  const lease = await prisma.lease.findFirst({
    where: { moveOutDate: null, room: { buildingId } },
    select: { id: true },
  });
  return lease !== null;
}
