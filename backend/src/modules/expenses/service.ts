import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import { Prisma } from "@/generated/prisma/client.js";
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  ListVacancyDueQuery,
  RecordVacancyInput,
  UpdateExpenseInput,
} from "./schema.js";

const Decimal = Prisma.Decimal;

async function findExpenseOrThrow(id: number) {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) {
    throw new NotFoundError("Expense not found");
  }
  return expense;
}

/** A room-level expense must sit under the building it names. */
async function assertRoomBelongsToBuilding(buildingId: number, roomId?: number) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) {
    throw new NotFoundError("Building not found");
  }
  if (roomId === undefined) {
    return;
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    throw new NotFoundError("Room not found");
  }
  if (room.buildingId !== buildingId) {
    throw new ValidationError("That room does not belong to the named building");
  }
}

export async function createExpense(input: CreateExpenseInput) {
  await assertRoomBelongsToBuilding(input.buildingId, input.roomId);

  const hasMeasure = input.quantity !== undefined && input.unitRate !== undefined;

  // Computed rather than accepted, so the stored amount can never disagree with
  // the quantity and rate it claims to come from.
  const amount = hasMeasure
    ? new Decimal(input.unitRate as number).mul(input.quantity as number).toDecimalPlaces(0)
    : input.amount !== undefined
      ? new Decimal(input.amount)
      : null;

  if (amount === null) {
    throw new ValidationError(
      "amount is required unless both quantity and unitRate are supplied",
    );
  }
  if (amount.lessThanOrEqualTo(0)) {
    throw new ValidationError("amount must be greater than zero");
  }

  return prisma.expense.create({
    data: {
      buildingId: input.buildingId,
      roomId: input.roomId ?? null,
      category: input.category,
      description: input.description,
      incurredAt: input.incurredAt,
      origin: "manual",
      quantity: hasMeasure ? new Decimal(input.quantity as number) : null,
      unitRate: hasMeasure ? new Decimal(input.unitRate as number) : null,
      amount,
    },
  });
}

export async function listExpenses(query: ListExpensesQuery) {
  const where = {
    ...(query.buildingId ? { buildingId: query.buildingId } : {}),
    ...(query.roomId ? { roomId: query.roomId } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.from || query.to
      ? {
          incurredAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  return paginate(
    query,
    prisma.expense.findMany({
      where,
      orderBy: [{ incurredAt: "asc" }, { id: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.expense.count({ where }),
  );
}

export async function getExpenseById(id: number) {
  return findExpenseOrThrow(id);
}

export async function updateExpense(id: number, input: UpdateExpenseInput) {
  await findExpenseOrThrow(id);
  return prisma.expense.update({ where: { id }, data: input });
}

/**
 * Removed outright rather than soft-deleted. Unlike an invoice, which is issued
 * to a tenant and whose record must survive a correction, an expense is an
 * internal note nobody receives — a mistyped one is noise.
 */
export async function deleteExpense(id: number) {
  await findExpenseOrThrow(id);
  await prisma.expense.delete({ where: { id } });
}

export interface VacancyResult {
  expense: Awaited<ReturnType<typeof prisma.expense.create>> | null;
  consumedUnits: number;
}

/**
 * A vacant room's electricity belongs to the owner. This records the month-end
 * reconciliation; the other trigger is lease creation, which catches a skipped
 * month or a vacancy too short to reach one.
 */
/**
 * Which rooms stood empty at a month's end without their electricity recorded.
 *
 * This is the cost an owner does not know is missing. Rent and utilities
 * announce themselves — a tenant is billed, or is not — but a room standing
 * empty runs its meter quietly, nobody is billed, and nothing anywhere asks
 * about it. So it is never recorded, and every revenue report is too flattering
 * by an amount nobody can name afterwards.
 *
 * Occupancy is judged at the month's END, matching the rule that already
 * refuses the record: a room let on the 20th was occupied when the month
 * closed, and its whole month of consumption belongs on the tenant's invoice.
 * "Empty during March" and "empty at the end of March" are different questions
 * with the same plausible-sounding name, and using the first would offer rows
 * that cannot be acted on.
 *
 * A room with no known reading at all is excluded rather than reported with a
 * null: consumption is a difference, there is nothing to subtract from, and
 * `recordVacancyElectricity` below refuses it outright.
 *
 * That exclusion is now NARROW rather than ordinary. A room records the meter
 * reading it was created at, so a never-let room normally has a position and
 * appears here — which is the case this round most needs to cover, since
 * nothing else will produce a reading for such a room before its first
 * tenancy. What remains excluded is a room added before opening readings were
 * recorded, or one created without stating a figure.
 *
 * The filter below did not have to change for that: it was written against the
 * general rule — no known reading — rather than against "never let", so it
 * narrowed on its own when the rule stopped applying to new rooms.
 */
export async function listVacancyDue(query: ListVacancyDueQuery) {
  const monthEnd = new Date(Date.UTC(query.year, query.month, 0));

  const rooms = await prisma.room.findMany({
    where: {
      // A retired room is not one the owner is waiting to let, and its meter is
      // not their running cost.
      isActive: true,
      ...(query.buildingId ? { buildingId: query.buildingId } : {}),
      // No tenancy covering the month's LAST DAY. Expressed as the negation of
      // the same test the guard uses: started by then, and not ended before it.
      leases: {
        none: {
          cancelledAt: null,
          startDate: { lte: monthEnd },
          OR: [{ moveOutDate: null }, { moveOutDate: { gt: monthEnd } }],
        },
      },
      // Not already recorded for that month.
      expenses: {
        none: {
          category: "vacancy_electricity",
          reconciliation: "month_end",
          year: query.year,
          month: query.month,
        },
      },
    },
    select: {
      id: true,
      roomCode: true,
      building: { select: { id: true, displayName: true, electricityRate: true } },
    },
    orderBy: [{ buildingId: "asc" }, { roomCode: "asc" }],
  });

  const withReadings = await Promise.all(
    rooms.map(async (room) => ({
      room,
      latest: await findLatestKnownReading(room.id),
    })),
  );

  return withReadings
    .filter((entry) => entry.latest !== null)
    .map(({ room, latest }) => ({
      roomId: room.id,
      roomCode: room.roomCode,
      building: { id: room.building.id, displayName: room.building.displayName },
      electricityRate: room.building.electricityRate,
      previousReading: latest!.reading,
      previousReadingAt: latest!.at,
      previousReadingSource: latest!.source,
    }));
}

export async function recordVacancyElectricity(
  input: RecordVacancyInput,
): Promise<VacancyResult> {
  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    include: { building: true },
  });
  if (!room) {
    throw new NotFoundError("Room not found");
  }

  const monthEnd = new Date(Date.UTC(input.year, input.month, 0));

  // If a tenancy covered the month's last day, that month's consumption belongs
  // on the tenant's invoice rather than the owner.
  //
  // Strictly greater than, not `gte`: an ending date is the first day NOT
  // covered, so a move-out dated the last day of the month means the room was
  // already empty for it. Using `gte` here would treat that day as occupied and
  // refuse a vacancy the owner genuinely bore.
  const occupying = await prisma.lease.findFirst({
    where: {
      roomId: input.roomId,
      startDate: { lte: monthEnd },
      // A cancelled tenancy occupied nothing, so it cannot be the reason a
      // month's consumption belongs to a tenant. Without this, cancelling a
      // lease would leave the room's vacancy electricity unrecordable for
      // every month that tenancy nominally spanned — the owner bearing a cost
      // the system refuses to let them write down.
      cancelledAt: null,
      OR: [{ moveOutDate: null }, { moveOutDate: { gt: monthEnd } }],
    },
    select: { id: true },
  });
  if (occupying) {
    throw new ValidationError(
      "That room had an active lease at the end of that month, so its consumption belongs on the tenant's invoice",
    );
  }

  const existing = await prisma.expense.findFirst({
    where: {
      roomId: input.roomId,
      category: "vacancy_electricity",
      reconciliation: "month_end",
      year: input.year,
      month: input.month,
    },
  });
  if (existing) {
    throw new ConflictError("That room already has a vacancy record for that month");
  }

  const latest = await findLatestKnownReading(input.roomId);
  if (latest === null) {
    throw new ValidationError(
      "That room has no known meter reading to measure vacancy consumption against",
    );
  }
  if (input.currentReading < latest.reading) {
    throw new ValidationError(
      "Reading cannot be below the room's last known meter reading",
    );
  }

  const consumedUnits = input.currentReading - latest.reading;
  if (consumedUnits === 0) {
    return { expense: null, consumedUnits: 0 };
  }

  const rate = room.building.electricityRate;
  const expense = await prisma.expense.create({
    data: {
      buildingId: room.buildingId,
      roomId: room.id,
      category: "vacancy_electricity",
      origin: "system",
      reconciliation: "month_end",
      description: `Vacancy electricity for ${input.year}-${String(input.month).padStart(2, "0")}: ${consumedUnits} kWh`,
      incurredAt: monthEnd,
      year: input.year,
      month: input.month,
      previousReading: latest.reading,
      currentReading: input.currentReading,
      quantity: new Decimal(consumedUnits),
      unitRate: rate,
      amount: rate.mul(consumedUnits).toDecimalPlaces(0),
    },
  });

  return { expense, consumedUnits };
}
