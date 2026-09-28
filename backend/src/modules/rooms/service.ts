import { prisma } from "@/lib/prisma.js";
import { mapPaginated, paginate, toSkipTake } from "@/lib/pagination.js";
import { findLatestKnownReading } from "@/lib/meter-history.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { inServiceWhere } from "@/modules/buildings/service.js";
import { buildingWhere, withinScope, type BuildingScope } from "@/middleware/staff-scope.js";
import { HOLDS_ITS_ROOM } from "@/modules/leases/occupancy.js";
// The same arithmetic the lease's own expected end uses. Computed in one place
// so a room and its tenancy can never disagree about the day it comes free.
import { addMonths } from "@/modules/leases/mapper.js";
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
  // Where the meter stood when the room was added. Reported so a caller can
  // show it; used by the meter-position resolution as one dated candidate
  // among four.
  initialMeterReading: true,
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
    // The id and the dates the end is computed from — and nothing else. A
    // room must not carry the tenancy's terms, tenant or rent: that is the
    // tenancy's own record, and a copy of it goes stale on the first change.
    select: { id: true, startDate: true, durationMonths: true, moveOutDate: true },
    take: 1,
  },
} as const;

type SelectedRoom = {
  leases: { id: number; startDate: Date; durationMonths: number; moveOutDate: Date | null }[];
};

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
  const holding = leases[0];
  return {
    ...room,
    isLet: holding !== undefined,
    /*
      Which tenancy holds it, and the day it comes free.

      Two facts, not a copy of the tenancy. They are what a rooms screen cannot
      answer without them — "when does this room come free" and "which tenancy
      is in it" — and the alternative is one request per row, which is the thing
      a listing exists to avoid. Everything else about that tenancy is a click
      away through the id.

      The end is the agreed one here: a room is let, so no move-out has been
      recorded. `moveOutDate` is selected anyway so the shape does not depend on
      the filter above staying what it is.
    */
    currentLeaseId: holding?.id ?? null,
    freeFrom:
      holding === undefined
        ? null
        : (holding.moveOutDate ?? addMonths(holding.startDate, holding.durationMonths)),
  };
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
      "ROOM_CODE_TAKEN",
      `Room code "${roomCode}" is already used by an active room in this building`,
    );
  }
}

export async function createRoom(input: CreateRoomInput, scope: BuildingScope = null) {
  const building = await prisma.building.findUnique({
    where: { id: input.buildingId },
  });

  if (!building || !withinScope(scope, building.id)) {
    throw new NotFoundError("BUILDING_NOT_FOUND", "Building not found");
  }

  if (!building.isActive) {
    throw new ValidationError("ROOM_BUILDING_RETIRED", "Cannot add a room to a retired building");
  }

  await assertRoomCodeAvailable(input.buildingId, input.roomCode);

  return toRoom(await prisma.room.create({ data: input, select: roomSelect }));
}

export async function listRooms(query: ListRoomsQuery, scope: BuildingScope = null) {
  const where = {
    /*
      The caller's buildings and the building they asked for, as an AND.

      Spread as two `buildingId` keys the second replaces the first — and the
      first is the scope, so `?buildingId=<somebody else's>` would have
      answered with somebody else's rooms. Found by asking exactly that.
    */
    AND: [
      ...(scope === null ? [] : [buildingWhere(scope)]),
      ...(query.buildingId ? [{ buildingId: query.buildingId }] : []),
      /*
        Whether a tenancy holds the room. In the query rather than by filtering
        the page afterwards: post-filtering returns short pages and a total
        that counts rooms the caller was never shown.

        Here in the same AND as the rest — and that is not tidiness. Written as
        its own `AND` key beside this one, TypeScript refused the duplicate
        property outright; written as two spread `leases` keys, nothing would
        have refused and the later would simply have replaced the earlier.
      */
      ...(query.vacant ? [{ leases: { none: HOLDS_ITS_ROOM } }] : []),
      ...(query.occupancy === "vacant"
        ? [{ leases: { none: HOLDS_ITS_ROOM } }]
        : query.occupancy === "let"
          ? [{ leases: { some: HOLDS_ITS_ROOM } }]
          : []),
    ],
    // Partial, case-insensitive. Without a building the same code can match
    // one room per building, since a code identifies a room only within its
    // building.
    ...(query.search
      ? { roomCode: { contains: query.search, mode: "insensitive" as const } }
      : {}),
    ...inServiceWhere(query.status),
    /*
      Available on a named date: no tenancy holds the room, and none that
      counted ends AFTER that date.

      `moveOutDate` strictly greater, never equal: an ending date is the first
      day no longer covered, so a tenancy ending exactly then abuts the new one
      with neither gap nor overlap. The same comparison the signing guard makes,
      written once here so the list and the rule cannot disagree.

      A CANCELLED tenancy is excluded — it covered no days, so counting its
      dates would hide the very room the cancellation freed.
    */
    ...(query.availableOn
      ? {
          leases: {
            none: {
              OR: [
                HOLDS_ITS_ROOM,
                { cancelledAt: null, moveOutDate: { gt: query.availableOn } },
              ],
            },
          },
        }
      : {}),
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

export async function getRoomById(id: number, scope: BuildingScope = null) {
  const room = await prisma.room.findUnique({ where: { id }, select: roomSelect });
  // A room outside the caller's buildings reads as absent, not as forbidden:
  // "you may not see this" confirms it exists, and an id that can be probed
  // for existence counts another building's rooms one request at a time.
  if (!room || !withinScope(scope, room.buildingId)) {
    throw new NotFoundError("ROOM_NOT_FOUND", "Room not found");
  }
  return toRoom(room);
}

export async function updateRoom(id: number, input: UpdateRoomInput, scope: BuildingScope = null) {
  const room = await getRoomById(id, scope);

  if (input.roomCode && input.roomCode !== room.roomCode && room.isActive) {
    await assertRoomCodeAvailable(room.buildingId, input.roomCode, room.id);
  }

  return toRoom(await prisma.room.update({ where: { id }, data: input, select: roomSelect }));
}

export async function retireRoom(id: number, scope: BuildingScope = null) {
  const room = await getRoomById(id, scope);

  // An occupied room cannot be taken out of service while a tenant holds it.
  // Read from what the room already reports, rather than asking again — the
  // fetch above answered this question on the way past.
  if (room.isLet) {
    throw new ConflictError("ROOM_RETIRE_HAS_ACTIVE_LEASE", "Cannot retire a room that has an active lease");
  }

  return toRoom(
    await prisma.room.update({
      where: { id },
      data: { isActive: false },
      select: roomSelect,
    }),
  );
}

export async function restoreRoom(id: number, scope: BuildingScope = null) {
  const room = await getRoomById(id, scope);

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
export async function getLatestMeterReading(id: number, scope: BuildingScope = null) {
  await getRoomById(id, scope);
  const latest = await findLatestKnownReading(id);
  return latest === null
    ? { reading: null, at: null, source: null }
    : { reading: latest.reading, at: latest.at, source: latest.source };
}
