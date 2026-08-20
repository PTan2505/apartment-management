import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
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

  const activeLease = await prisma.lease.findFirst({
    where: { roomId: input.roomId, moveOutDate: null },
  });
  if (activeLease) {
    throw new ConflictError("That room already has an active lease");
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

export async function listLeases(query: ListLeasesQuery) {
  const where = {
    ...(query.roomId ? { roomId: query.roomId } : {}),
    ...(query.active === undefined
      ? {}
      : query.active
        ? { moveOutDate: null }
        : { moveOutDate: { not: null } }),
    // Matches any lease the person occupied, primary or not.
    ...(query.customerId ? { occupants: { some: { userId: query.customerId } } } : {}),
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
  const lastInvoice = await prisma.invoice.findFirst({
    where: { leaseId: id, voidedAt: null },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { currentElectricityUse: true },
  });
  if (lastInvoice && endMeterReading < lastInvoice.currentElectricityUse) {
    throw new ValidationError(
      "Closing meter reading cannot be below the reading already invoiced for this lease",
    );
  }

  // Finalizing the lease also closes its occupancy records, so nobody is left
  // recorded as living in a room that is no longer let.
  await prisma.$transaction(async (tx) => {
    await tx.lease.update({ where: { id }, data: { moveOutDate, endMeterReading } });
    await tx.leaseOccupant.updateMany({
      where: { leaseId: id, leftAt: null },
      data: { leftAt: moveOutDate },
    });
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
