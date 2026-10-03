// A VALUE import, not a type-only one: `new Prisma.Decimal(0)` needs the class
// at runtime, and `import type` erases it — which compiles cleanly and then
// throws on the first empty room.
import { Prisma } from "@/generated/prisma/client.js";
import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { withinScope, type BuildingScope } from "@/middleware/staff-scope.js";
import type {
  AddRoomFurnitureInput,
  CheckInFurnitureInput,
  CreateFurnitureItemInput,
  FurnitureConditionValue,
  ListFurnitureItemsQuery,
  UpdateFurnitureItemInput,
  UpdateRoomFurnitureInput,
} from "./schema.js";

/**
 * How the four conditions rank, worst last.
 *
 * The ONLY thing this ordering is for is answering "did it come back worse than
 * it went out". It is not a score and nothing adds it up.
 */
const RANK: Record<FurnitureConditionValue, number> = { new: 0, good: 1, worn: 2, damaged: 3 };

function cameBackWorse(
  handover: FurnitureConditionValue,
  returned: FurnitureConditionValue | null,
): boolean {
  // Unchecked is not "worse". Nobody looked, which is a third state.
  if (returned === null) return false;
  return RANK[returned] > RANK[handover];
}

/* ------------------------------------------------------------------ */
/* The building's catalogue                                            */
/* ------------------------------------------------------------------ */

const itemSelect = {
  id: true,
  buildingId: true,
  name: true,
  kind: true,
  make: true,
  unitValue: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * The building, or NOT FOUND — including when it is simply not this caller's.
 *
 * Scoped here rather than left to the router, because a manager reads this
 * catalogue and an unscoped read would let them page through another
 * building's inventory one id at a time.
 */
async function buildingInScope(buildingId: number, scope: BuildingScope) {
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { id: true },
  });
  if (!building || !withinScope(scope, building.id)) {
    throw new NotFoundError("BUILDING_NOT_FOUND", "Building not found");
  }
  return building;
}

/**
 * Two entries called "Giường" in one building cannot be told apart at the
 * moment of choosing one, which is the moment it matters. A retired entry
 * releases its name; the same name in another building is unaffected.
 */
async function assertNameFree(buildingId: number, name: string, exceptId?: number) {
  const clash = await prisma.furnitureItem.findFirst({
    where: {
      buildingId,
      name,
      isActive: true,
      ...(exceptId === undefined ? {} : { id: { not: exceptId } }),
    },
    select: { id: true },
  });
  if (clash) {
    throw new ConflictError(
      "FURNITURE_ITEM_NAME_TAKEN",
      `Toà này đã có món tên "${name}"`,
    );
  }
}

export async function listFurnitureItems(
  buildingId: number,
  query: ListFurnitureItemsQuery,
  scope: BuildingScope,
) {
  await buildingInScope(buildingId, scope);
  const where = { buildingId, ...(query.includeInactive ? {} : { isActive: true }) };
  return paginate(
    query,
    prisma.furnitureItem.findMany({
      where,
      select: itemSelect,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      ...toSkipTake(query),
    }),
    prisma.furnitureItem.count({ where }),
  );
}

export async function createFurnitureItem(
  buildingId: number,
  input: CreateFurnitureItemInput,
  scope: BuildingScope,
) {
  await buildingInScope(buildingId, scope);
  await assertNameFree(buildingId, input.name);
  return prisma.furnitureItem.create({
    data: { buildingId, ...input, make: input.make ?? null },
    select: itemSelect,
  });
}

async function itemInBuilding(buildingId: number, itemId: number, scope: BuildingScope) {
  await buildingInScope(buildingId, scope);
  const item = await prisma.furnitureItem.findFirst({
    where: { id: itemId, buildingId },
    select: itemSelect,
  });
  if (!item) throw new NotFoundError("FURNITURE_ITEM_NOT_FOUND", "Không tìm thấy món này");
  return item;
}

/**
 * Re-pricing reaches rooms furnished AFTERWARDS and nothing else.
 *
 * Rooms already holding the item keep the value they were furnished at — it is
 * copied onto the holding, so there is nothing here to cascade. Same rule as a
 * tenancy's rent against a room's.
 */
export async function updateFurnitureItem(
  buildingId: number,
  itemId: number,
  input: UpdateFurnitureItemInput,
  scope: BuildingScope,
) {
  await itemInBuilding(buildingId, itemId, scope);
  if (input.name !== undefined) await assertNameFree(buildingId, input.name, itemId);
  return prisma.furnitureItem.update({
    where: { id: itemId },
    data: input,
    select: itemSelect,
  });
}

/**
 * Retired, never deleted: rooms refer to it, and a hand-over record was written
 * from it. Retiring releases the name.
 */
export async function retireFurnitureItem(
  buildingId: number,
  itemId: number,
  scope: BuildingScope,
) {
  const item = await itemInBuilding(buildingId, itemId, scope);
  if (!item.isActive) {
    throw new ConflictError("FURNITURE_ITEM_ALREADY_RETIRED", "Món này đã ngừng dùng");
  }
  return prisma.furnitureItem.update({
    where: { id: itemId },
    data: { isActive: false },
    select: itemSelect,
  });
}

export async function restoreFurnitureItem(
  buildingId: number,
  itemId: number,
  scope: BuildingScope,
) {
  const item = await itemInBuilding(buildingId, itemId, scope);
  if (item.isActive) {
    throw new ConflictError("FURNITURE_ITEM_ALREADY_ACTIVE", "Món này đang dùng");
  }
  // The name was released when it was retired, so somebody may have taken it.
  await assertNameFree(buildingId, item.name, itemId);
  return prisma.furnitureItem.update({
    where: { id: itemId },
    data: { isActive: true },
    select: itemSelect,
  });
}

/* ------------------------------------------------------------------ */
/* What a room holds                                                   */
/* ------------------------------------------------------------------ */

const holdingSelect = {
  id: true,
  roomId: true,
  furnitureItemId: true,
  quantity: true,
  unitValue: true,
  condition: true,
  note: true,
  acquiredOn: true,
  createdAt: true,
  updatedAt: true,
  furnitureItem: { select: { id: true, name: true, kind: true, make: true, isActive: true } },
} as const;

type HoldingRow = {
  quantity: number;
  unitValue: Prisma.Decimal;
  furnitureItem: { name: string; kind: string; make: string | null; isActive: boolean };
};

/** Quantity × value, stated rather than left for each screen to multiply. */
function toHolding<T extends HoldingRow>(holding: T) {
  return {
    ...holding,
    name: holding.furnitureItem.name,
    kind: holding.furnitureItem.kind,
    make: holding.furnitureItem.make,
    /** Whether the catalogue entry behind it has since been retired. */
    itemRetired: !holding.furnitureItem.isActive,
    totalValue: holding.unitValue.mul(holding.quantity),
  };
}

async function roomInScope(roomId: number, scope: BuildingScope) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, buildingId: true },
  });
  if (!room || !withinScope(scope, room.buildingId)) {
    throw new NotFoundError("ROOM_NOT_FOUND", "Room not found");
  }
  return room;
}

/**
 * What is in this room — answerable with no tenancy, which is the question
 * that started this whole change.
 */
export async function listRoomFurniture(roomId: number, scope: BuildingScope) {
  await roomInScope(roomId, scope);
  const rows = await prisma.roomFurniture.findMany({
    where: { roomId },
    select: holdingSelect,
    orderBy: [{ acquiredOn: "asc" }, { id: "asc" }],
  });
  const holdings = rows.map(toHolding);
  return {
    data: holdings,
    // Starts from a real zero rather than from the first row, so a room holding
    // nothing answers 0 instead of throwing. An unfurnished room is a normal
    // state here, not an edge case.
    totalValue: holdings.reduce(
      (sum, holding) => sum.add(holding.totalValue),
      new Prisma.Decimal(0),
    ),
  };
}

export async function addRoomFurniture(
  roomId: number,
  input: AddRoomFurnitureInput,
  scope: BuildingScope,
) {
  const room = await roomInScope(roomId, scope);

  const item = await prisma.furnitureItem.findFirst({
    where: { id: input.furnitureItemId, buildingId: room.buildingId },
    select: { id: true, isActive: true, unitValue: true },
  });
  if (!item) {
    throw new NotFoundError(
      "FURNITURE_ITEM_NOT_FOUND",
      "Món này không có trong danh mục của toà nhà",
    );
  }
  if (!item.isActive) {
    throw new ValidationError(
      "FURNITURE_ITEM_RETIRED",
      "Món này đã ngừng dùng, không thêm vào phòng được nữa",
    );
  }

  return toHolding(
    await prisma.roomFurniture.create({
      data: {
        roomId,
        furnitureItemId: item.id,
        quantity: input.quantity,
        // COPIED now. Re-pricing the catalogue later must not restate what this
        // room was furnished with.
        unitValue: item.unitValue,
        condition: input.condition,
        note: input.note ?? null,
        acquiredOn: input.acquiredOn ?? new Date(),
      },
      select: holdingSelect,
    }),
  );
}

async function holdingInRoom(roomId: number, holdingId: number, scope: BuildingScope) {
  await roomInScope(roomId, scope);
  const holding = await prisma.roomFurniture.findFirst({
    where: { id: holdingId, roomId },
    select: { id: true },
  });
  if (!holding) {
    throw new NotFoundError("ROOM_FURNITURE_NOT_FOUND", "Phòng này không có món đó");
  }
  return holding;
}

export async function updateRoomFurniture(
  roomId: number,
  holdingId: number,
  input: UpdateRoomFurnitureInput,
  scope: BuildingScope,
) {
  await holdingInRoom(roomId, holdingId, scope);
  return toHolding(
    await prisma.roomFurniture.update({
      where: { id: holdingId },
      data: input,
      select: holdingSelect,
    }),
  );
}

/**
 * Furniture gets thrown out.
 *
 * Deleted rather than dated, unlike almost everything else here — because the
 * record that MATTERS has already been copied. A hand-over record naming this
 * item is untouched by this, which is exactly why it holds its own copy of the
 * name, value and condition instead of pointing here.
 */
export async function removeRoomFurniture(
  roomId: number,
  holdingId: number,
  scope: BuildingScope,
) {
  await holdingInRoom(roomId, holdingId, scope);
  await prisma.roomFurniture.delete({ where: { id: holdingId } });
  return { removed: true as const };
}

/* ------------------------------------------------------------------ */
/* The hand-over record                                                */
/* ------------------------------------------------------------------ */

/**
 * The rows to freeze onto a tenancy being created.
 *
 * Takes the transaction client, because this runs INSIDE lease creation: a
 * tenancy with no hand-over record cannot be checked in later, and the absence
 * would be discovered at move-out, which is the worst possible moment.
 *
 * An empty list is a legitimate result and is NOT an error — "handed over with
 * nothing" is a fact.
 */
export async function handoverRowsFor(
  tx: Prisma.TransactionClient,
  roomId: number,
  handedOverOn: Date,
) {
  const holdings = await tx.roomFurniture.findMany({
    where: { roomId },
    select: {
      quantity: true,
      unitValue: true,
      condition: true,
      note: true,
      furnitureItem: { select: { name: true, kind: true, make: true } },
    },
    orderBy: { id: "asc" },
  });

  return holdings.map((holding) => ({
    // Copied as TEXT, not pointed at: retiring the catalogue entry or throwing
    // the item out must not empty a record that exists to settle an argument.
    name: holding.furnitureItem.name,
    kind: holding.furnitureItem.kind,
    make: holding.furnitureItem.make,
    quantity: holding.quantity,
    unitValue: holding.unitValue,
    handoverCondition: holding.condition,
    handoverNote: holding.note,
    handedOverOn,
  }));
}

const handoverSelect = {
  id: true,
  leaseId: true,
  name: true,
  kind: true,
  make: true,
  quantity: true,
  unitValue: true,
  handoverCondition: true,
  handoverNote: true,
  handedOverOn: true,
  returnCondition: true,
  returnNote: true,
  returnedAt: true,
} as const;

type HandoverRow = {
  quantity: number;
  unitValue: Prisma.Decimal;
  handoverCondition: FurnitureConditionValue;
  returnCondition: FurnitureConditionValue | null;
};

function toHandover<T extends HandoverRow>(entry: T) {
  return {
    ...entry,
    totalValue: entry.unitValue.mul(entry.quantity),
    /** Nobody looked. A third state, never "came back fine". */
    unchecked: entry.returnCondition === null,
    worse: cameBackWorse(entry.handoverCondition, entry.returnCondition),
  };
}

/**
 * What this tenant received, and what came back.
 *
 * Read-only on purpose: there is no endpoint anywhere that changes a value or
 * a hand-over condition. A record the interested party can edit afterwards
 * settles nothing.
 */
export async function listLeaseFurniture(leaseId: number) {
  const [lease, rows] = await Promise.all([
    prisma.lease.findUnique({
      where: { id: leaseId },
      select: { furnitureRecordedAt: true },
    }),
    prisma.leaseFurniture.findMany({
      where: { leaseId },
      select: handoverSelect,
      orderBy: { id: "asc" },
    }),
  ]);
  if (lease === null) throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");

  const entries = rows.map(toHandover);
  return {
    data: entries,
    /*
      Whether a hand-over was recorded AT ALL — which an empty list cannot say.

      False means nobody ever wrote one, as for every tenancy signed before
      this existed. True with an empty list means the room was handed over
      unfurnished, which somebody established. The screens must not read the
      first as the second.
    */
    recorded: lease.furnitureRecordedAt !== null,
    recordedAt: lease.furnitureRecordedAt,
    /** Enough to raise a charge from, and nothing that raises one. */
    worse: entries.filter((entry) => entry.worse),
    uncheckedCount: entries.filter((entry) => entry.unchecked).length,
  };
}

/**
 * Records a condition at return for the items somebody actually looked at.
 *
 * Runs inside the move-out transaction. Items left out of the list stay
 * UNCHECKED — that is the whole reason the column is nullable, and why this
 * updates named rows rather than writing a default across all of them.
 *
 * Refuses an id belonging to another tenancy rather than silently ignoring it:
 * a move-out that reports success while recording nothing is the failure this
 * feature exists to prevent.
 */
export async function checkInFurniture(
  tx: Prisma.TransactionClient,
  leaseId: number,
  input: CheckInFurnitureInput,
  returnedAt: Date,
) {
  if (input.length === 0) return;

  const owned = await tx.leaseFurniture.findMany({
    where: { leaseId, id: { in: input.map((entry) => entry.leaseFurnitureId) } },
    select: { id: true },
  });
  if (owned.length !== input.length) {
    throw new ValidationError(
      "LEASE_FURNITURE_FOREIGN",
      "Có món không thuộc bản bàn giao của hợp đồng này",
    );
  }

  for (const entry of input) {
    await tx.leaseFurniture.update({
      where: { id: entry.leaseFurnitureId },
      data: {
        returnCondition: entry.returnCondition,
        returnNote: entry.returnNote ?? null,
        returnedAt,
      },
    });
  }
}
