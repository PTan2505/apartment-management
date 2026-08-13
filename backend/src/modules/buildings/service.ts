import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError } from "@/lib/errors.js";
import { buildingHasActiveLease } from "@/modules/leases/service.js";
import type { CreateBuildingInput, UpdateBuildingInput } from "./schema.js";

export async function createBuilding(input: CreateBuildingInput) {
  return prisma.building.create({ data: input });
}

export async function listBuildings(includeInactive: boolean) {
  return prisma.building.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBuildingById(id: string) {
  const building = await prisma.building.findUnique({ where: { id } });
  if (!building) {
    throw new NotFoundError("Building not found");
  }
  return building;
}

export async function updateBuilding(id: string, input: UpdateBuildingInput) {
  await getBuildingById(id);
  return prisma.building.update({ where: { id }, data: input });
}

export async function retireBuilding(id: string) {
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

export async function restoreBuilding(id: string) {
  await getBuildingById(id);
  return prisma.building.update({ where: { id }, data: { isActive: true } });
}
