import { prisma } from "@/lib/prisma.js";
import { mapPaginated, paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { HOLDS_ITS_ROOM } from "@/modules/leases/occupancy.js";
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
  /**
   * Whether a tenancy is running here, fetched alongside rather than asked for
   * afterwards. `take: 1` because the question is whether one exists — a room
   * can only have one running tenancy, and counting them all to compare against
   * zero reads more rows to learn the same thing.
   *
   * This never reaches a caller: `toRoom` turns it into a boolean. It is
   * selected rather than counted so the shape does not depend on which relation
   * counts a Prisma version supports filtering.
   */
  leases: {
    where: HOLDS_ITS_ROOM,
    select: { id: true },
    take: 1,
  },
} as const;

type SelectedRoom = { leases: { id: number }[] };

/**
 * Turns the fetched tenancy into the fact a caller wants.
 *
 * A room says only WHETHER it is let, never by whom. The tenancy's terms,
 * tenant and dates belong to the tenancy; copying them into every room that
 * references it is exactly the duplication `building` above is careful to
 * avoid, and it would go stale on the first change to the lease.
 *
 * "Let" means a tenancy with no move-out recorded — including one that has run
 * past its agreed term. Such a room is not free to offer: the tenancy has not
 * been closed, and letting it again would double-book a room somebody is
 * living in.
 */
function toRoom<T extends SelectedRoom>({ leases, ...room }: T) {
  return { ...room, isLet: leases.length > 0 };
}

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

  return toRoom(await prisma.room.create({ data: input, select: roomSelect }));
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
    // Rooms that can be let. Applied in the query rather than by filtering the
    // page afterwards: post-filtering would return short pages and a total that
    // counts rooms the caller was not shown.
    ...(query.vacant ? { leases: { none: HOLDS_ITS_ROOM } } : {}),
  };

  return mapPaginated(
    await paginate(
      query,
      prisma.room.findMany({
        where,
        orderBy: { createdAt: "asc" },
        select: roomSelect,
        ...toSkipTake(query),
      }),
      prisma.room.count({ where }),
    ),
    toRoom,
  );
}

export async function getRoomById(id: number) {
  const room = await prisma.room.findUnique({ where: { id }, select: roomSelect });
  if (!room) {
    throw new NotFoundError("Room not found");
  }
  return toRoom(room);
}

export async function updateRoom(id: number, input: UpdateRoomInput) {
  const room = await getRoomById(id);

  if (input.roomCode && input.roomCode !== room.roomCode && room.isActive) {
    await assertRoomCodeAvailable(room.buildingId, input.roomCode, room.id);
  }

  return toRoom(await prisma.room.update({ where: { id }, data: input, select: roomSelect }));
}

export async function retireRoom(id: number) {
  const room = await getRoomById(id);

  // An occupied room cannot be taken out of service while a tenant holds it.
  // Read from what the room already reports, rather than asking again — the
  // fetch above answered this question on the way past.
  if (room.isLet) {
    throw new ConflictError("Cannot retire a room that has an active lease");
  }

  return toRoom(
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
      select: roomSelect,
    }),
  );
}

export async function restoreRoom(id: number) {
  const room = await getRoomById(id);

  // Retiring a room frees its code for reuse, so restoring can collide with a
  // newer active room that has since taken that code.
  await assertRoomCodeAvailable(room.buildingId, room.roomCode, room.id);

  return toRoom(
    await prisma.room.update({
      where: { id },
      data: { isActive: true },
      select: roomSelect,
    }),
  );
}

/**
 * Where the room's meter stands, as far as the system knows.
 *
 * Asked for one room at a time rather than carried on every room: resolving it
 * reads across the room's leases and its vacancy expenses, and doing that for
 * twenty rooms in a listing would pay a real cost for a figure only one of them
 * is ever about.
 *
 * `null` for a room that has never been let and has no recorded vacancy — there
 * is genuinely nothing to fall back on, and the caller must ask for a reading.
 * That is the case a lease-creation form has to handle rather than assume.
 */
export async function getLatestMeterReading(id: number) {
  await getRoomById(id);
  const latest = await findLatestKnownReading(id);
  return latest === null
    ? { reading: null, at: null, source: null }
    : { reading: latest.reading, at: latest.at, source: latest.source };
}
