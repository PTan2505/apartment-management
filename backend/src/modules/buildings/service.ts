import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake, type PageParams } from "@/lib/pagination.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
import { buildingHasActiveLease } from "@/modules/leases/service.js";
import type {
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

export async function getBuildingById(id: number) {
  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) {
    throw new NotFoundError("Building not found");
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
