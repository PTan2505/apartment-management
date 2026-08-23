import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { roomHasActiveLease } from "@/modules/leases/service.js";
import type { CreateRoomInput, ListRoomsQuery, UpdateRoomInput } from "./schema.js";

/**
 * Every room reports the building it belongs to.
 *
 * A room code identifies a room only within its building — the same code may
 * exist in several buildings, and the search deliberately returns one entry per
 * matching building. A room returned without its building is therefore
 * ambiguous, and `buildingId` alone is not something a client can display.
 *
 * Limited to what identifies the building. Its rates, address, and active state
 * belong to the building's own representation; embedding them here would
 * duplicate data into every room and go stale the moment a rate changes.
 *
 * `buildingId` is kept alongside, so callers reading it are unaffected.
 */
const roomSelect = {
  id: true,
  buildingId: true,
  roomCode: true,
  baseRent: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  building: {
    select: { id: true, displayName: true },
  },
} as const;

/**
 * Room codes must be unique among ACTIVE rooms in a building. A partial unique
 * index enforces this in the database; this check runs first so the common case
 * returns a clean 409 instead of a raw constraint violation.
 */
async function assertRoomCodeAvailable(
  buildingId: number,
  roomCode: string,
  excludeRoomId?: number,
) {
  const clash = await prisma.room.findFirst({
    where: {
      buildingId,
      roomCode,
      isActive: true,
      ...(excludeRoomId ? { id: { not: excludeRoomId } } : {}),
    },
  });

  if (clash) {
    throw new ConflictError(
      `Room code "${roomCode}" is already used by an active room in this building`,
    );
  }
}

export async function createRoom(input: CreateRoomInput) {
  const building = await prisma.building.findUnique({
    where: { id: input.buildingId },
  });

  if (!building) {
    throw new NotFoundError("Building not found");
  }

  if (!building.isActive) {
    throw new ValidationError("Cannot add a room to a retired building");
  }

  await assertRoomCodeAvailable(input.buildingId, input.roomCode);

  return prisma.room.create({ data: input, select: roomSelect });
}

export async function listRooms(query: ListRoomsQuery) {
  const where = {
    ...(query.buildingId ? { buildingId: query.buildingId } : {}),
    // Partial, case-insensitive. Without a building the same code can match
    // one room per building, since a code identifies a room only within its
    // building.
    ...(query.search
      ? { roomCode: { contains: query.search, mode: "insensitive" as const } }
      : {}),
    ...(query.includeInactive ? {} : { isActive: true }),
  };

  return paginate(
    query,
    prisma.room.findMany({
      where,
      orderBy: { createdAt: "asc" },
      select: roomSelect,
      ...toSkipTake(query),
    }),
    prisma.room.count({ where }),
  );
}

export async function getRoomById(id: number) {
  const room = await prisma.room.findUnique({ where: { id }, select: roomSelect });
  if (!room) {
    throw new NotFoundError("Room not found");
  }
  return room;
}

export async function updateRoom(id: number, input: UpdateRoomInput) {
  const room = await getRoomById(id);

  if (input.roomCode && input.roomCode !== room.roomCode && room.isActive) {
    await assertRoomCodeAvailable(room.buildingId, input.roomCode, room.id);
  }

  return prisma.room.update({ where: { id }, data: input, select: roomSelect });
}

export async function retireRoom(id: number) {
  await getRoomById(id);

  // An occupied room cannot be taken out of service while a tenant holds it.
  if (await roomHasActiveLease(id)) {
    throw new ConflictError("Cannot retire a room that has an active lease");
  }

  return prisma.room.update({
    where: { id },
    data: { isActive: false },
    select: roomSelect,
  });
}

export async function restoreRoom(id: number) {
  const room = await getRoomById(id);

  // Retiring a room frees its code for reuse, so restoring can collide with a
  // newer active room that has since taken that code.
  await assertRoomCodeAvailable(room.buildingId, room.roomCode, room.id);

  return prisma.room.update({
    where: { id },
    data: { isActive: true },
    select: roomSelect,
  });
}
