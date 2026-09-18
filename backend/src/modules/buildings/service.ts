import { prisma } from "@/lib/prisma.js";
import { mapPaginated, paginate, toSkipTake, type PageParams } from "@/lib/pagination.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
import { HOLDS_ITS_ROOM } from "@/modules/leases/occupancy.js";
import { buildingHasActiveLease } from "@/modules/leases/service.js";
import type {
  BuildingLocationsQuery,
  CreateBuildingInput,
  ListBuildingsQuery,
  UpdateBuildingInput,
} from "./schema.js";

export async function createBuilding(input: CreateBuildingInput) {
  return prisma.building.create({ data: input });
}

export async function listBuildings(query: ListBuildingsQuery, page: PageParams) {
  const where = {
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(query.ward
      ? { ward: { contains: query.ward, mode: "insensitive" as const } }
      : {}),
    ...(query.city
      ? { city: { contains: query.city, mode: "insensitive" as const } }
      : {}),
  };
  const buildings = await paginate(
    page,
    prisma.building.findMany({ where, orderBy: { createdAt: "asc" }, ...toSkipTake(page) }),
    prisma.building.count({ where }),
  );

  const counts = await roomCounts(buildings.data.map((building) => building.id));
  return mapPaginated(buildings, (building) => ({
    ...building,
    ...(counts.get(building.id) ?? { roomsLet: 0, roomsEmpty: 0 }),
  }));
}

/**
 * How full each of these buildings is: rooms let, and rooms standing empty.
 *
 * Counted here rather than by the caller. A caller deriving it would read every
 * room of every building on the page, and would need its own copy of what "let"
 * means — the duplication `roomOccupiedBy` exists to prevent.
 *
 * Two grouped queries over the page's ids, not a room read per building: a page
 * is twenty buildings, and twenty round trips to learn two numbers each is the
 * shape that gets slow quietly.
 *
 * Rooms OUT OF SERVICE are in neither figure. A retired room cannot be offered
 * to anybody, so counting it as empty would report work that does not exist.
 */
async function roomCounts(buildingIds: number[]) {
  const counts = new Map<number, { roomsLet: number; roomsEmpty: number }>();
  if (buildingIds.length === 0) return counts;

  const inService = { buildingId: { in: buildingIds }, isActive: true };
  // One transaction: between two separate reads a move-out could land, and the
  // let count would then not be a subset of the in-service count.
  const [total, let_] = await prisma.$transaction([
    prisma.room.groupBy({ by: ["buildingId"], where: inService, _count: { _all: true } }),
    prisma.room.groupBy({
      by: ["buildingId"],
      // The rule for "let" comes from the tenancy module, imported rather than
      // restated: a tenancy with no move-out and no cancellation holds its room,
      // including one that has run past its agreed term.
      where: { ...inService, leases: { some: HOLDS_ITS_ROOM } },
      _count: { _all: true },
    }),
  ]);

  const letByBuilding = new Map(let_.map((row) => [row.buildingId, row._count._all]));
  for (const row of total) {
    const roomsLet = letByBuilding.get(row.buildingId) ?? 0;
    counts.set(row.buildingId, { roomsLet, roomsEmpty: row._count._all - roomsLet });
  }
  return counts;
}

/**
 * Orders text as Vietnamese rather than by character code.
 *
 * The database cannot do this as configured: it was created with `C` collation,
 * so `ORDER BY city` sorts by byte value and places `Đà Nẵng` after
 * `Hồ Chí Minh` — outside its alphabetical position, which reads as unordered.
 * Prisma's `orderBy` cannot express a `COLLATE` clause, so ordering in SQL would
 * mean a raw query and an untyped result. Sorting here is still ordering at the
 * source; it just happens in the service.
 */
const vietnamese = new Intl.Collator("vi");

export interface BuildingLocation {
  city: string;
  wards: string[];
}

export async function listBuildingLocations(
  query: BuildingLocationsQuery,
): Promise<BuildingLocation[]> {
  const rows = await prisma.building.findMany({
    where: query.includeInactive ? {} : { isActive: true },
    // Deduplicated in SQL, so at most one row per pair reaches us. The count is
    // bounded by the number of buildings.
    distinct: ["city", "ward"],
    select: { city: true, ward: true },
  });

  // The same ward name can exist in more than one city, so the pairing is what
  // makes a narrowed choice correct — group rather than returning two flat lists.
  const byCity = new Map<string, Set<string>>();
  for (const row of rows) {
    const wards = byCity.get(row.city) ?? new Set<string>();
    wards.add(row.ward);
    byCity.set(row.city, wards);
  }

  return [...byCity.entries()]
    .map(([city, wards]) => ({
      city,
      wards: [...wards].sort(vietnamese.compare),
    }))
    .sort((a, b) => vietnamese.compare(a.city, b.city));
}

export async function getBuildingById(id: number) {
  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) {
    throw new NotFoundError("BUILDING_NOT_FOUND", "Building not found");
  }
  return building;
}

export async function updateBuilding(id: number, input: UpdateBuildingInput) {
  await getBuildingById(id);
  return prisma.building.update({ where: { id }, data: input });
}

export async function retireBuilding(id: number) {
  await getBuildingById(id);

  // A building with tenants still in place cannot be taken out of service.
  if (await buildingHasActiveLease(id)) {
    throw new ConflictError(
      "BUILDING_RETIRE_HAS_ACTIVE_LEASE",
      "Cannot retire a building while one of its rooms has an active lease",
    );
  }

  // Retiring a building deliberately does NOT cascade to its rooms: a building
  // being retired and a specific room being taken offline are separate events.
  return prisma.building.update({ where: { id }, data: { isActive: false } });
}

export async function restoreBuilding(id: number) {
  await getBuildingById(id);
  return prisma.building.update({ where: { id }, data: { isActive: true } });
}
