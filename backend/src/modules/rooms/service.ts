import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import type { CreateRoomInput, ListRoomsQuery, UpdateRoomInput } from "./schema.js";

/**
 * Room codes must be unique among ACTIVE rooms in a building. A partial unique
 * index enforces this in the database; this check runs first so the common case
 * returns a clean 409 instead of a raw constraint violation.
 */
async function assertRoomCodeAvailable(
  buildingId: string,
  roomCode: string,
  excludeRoomId?: string,
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

  return prisma.room.create({ data: input });
}

export async function listRooms(query: ListRoomsQuery) {
  return prisma.room.findMany({
    where: {
      ...(query.buildingId ? { buildingId: query.buildingId } : {}),
      ...(query.includeInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    throw new NotFoundError("Room not found");
  }
  return room;
}

export async function updateRoom(id: string, input: UpdateRoomInput) {
  const room = await getRoomById(id);

  if (input.roomCode && input.roomCode !== room.roomCode && room.isActive) {
    await assertRoomCodeAvailable(room.buildingId, input.roomCode, room.id);
  }

  return prisma.room.update({ where: { id }, data: input });
}

export async function retireRoom(id: string) {
  await getRoomById(id);
  return prisma.room.update({ where: { id }, data: { isActive: false } });
}

export async function restoreRoom(id: string) {
  const room = await getRoomById(id);

  // Retiring a room frees its code for reuse, so restoring can collide with a
  // newer active room that has since taken that code.
  await assertRoomCodeAvailable(room.buildingId, room.roomCode, room.id);

  return prisma.room.update({ where: { id }, data: { isActive: true } });
}
