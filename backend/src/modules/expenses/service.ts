import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import { Prisma } from "@/generated/prisma/client.js";
import type {
  CreateExpenseInput,
  ListExpensesQuery,
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

  // If a tenancy was live at month end, that month's consumption belongs on the
  // tenant's invoice rather than the owner.
  const occupying = await prisma.lease.findFirst({
    where: {
      roomId: input.roomId,
      startDate: { lte: monthEnd },
      OR: [{ moveOutDate: null }, { moveOutDate: { gte: monthEnd } }],
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
