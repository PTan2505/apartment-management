import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake, type PageParams } from "@/lib/pagination.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
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
  return paginate(
    page,
    prisma.building.findMany({ where, orderBy: { createdAt: "asc" }, ...toSkipTake(page) }),
    prisma.building.count({ where }),
  );
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
