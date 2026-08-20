import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import type {
  CreateServiceFeeInput,
  ListServiceFeesQuery,
  SelectServiceFeeInput,
  UpdateSelectionInput,
  UpdateServiceFeeInput,
} from "./schema.js";

const feeSelect = {
  id: true,
  buildingId: true,
  name: true,
  unitAmount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

async function getBuildingOrThrow(buildingId: number) {
  const building = await prisma.building.findUnique({ where: { id: buildingId } });
  if (!building) throw new NotFoundError("Building not found");
  return building;
}

export async function getServiceFeeById(id: number) {
  const fee = await prisma.buildingServiceFee.findUnique({ where: { id }, select: feeSelect });
  if (!fee) throw new NotFoundError("Service fee not found");
  return fee;
}

/**
 * Two entries called "Parking" in one building cannot be told apart at the
 * moment of selecting one, which is the moment it matters. A retired fee
 * releases its name; the same name in another building is unaffected.
 */
async function assertNameAvailable(buildingId: number, name: string, exceptId?: number) {
  const clash = await prisma.buildingServiceFee.findFirst({
    where: {
      buildingId,
      name,
      isActive: true,
      ...(exceptId === undefined ? {} : { id: { not: exceptId } }),
    },
  });
  if (clash) {
    throw new ConflictError(`This building already has a fee named "${name}"`);
  }
}

export async function createServiceFee(buildingId: number, input: CreateServiceFeeInput) {
  await getBuildingOrThrow(buildingId);
  await assertNameAvailable(buildingId, input.name);

  return prisma.buildingServiceFee.create({
    data: { buildingId, name: input.name, unitAmount: input.unitAmount },
    select: feeSelect,
  });
}

export async function listServiceFees(buildingId: number, query: ListServiceFeesQuery) {
  await getBuildingOrThrow(buildingId);

  const where = {
    buildingId,
    ...(query.includeInactive ? {} : { isActive: true }),
  };

  return paginate(
    query,
    prisma.buildingServiceFee.findMany({
      where,
      select: feeSelect,
      orderBy: { name: "asc" },
      ...toSkipTake(query),
    }),
    prisma.buildingServiceFee.count({ where }),
  );
}

/**
 * Changing the amount here affects only selections made afterwards. Leases that
 * already selected this fee hold their own copy — see LeaseServiceFee.
 */
export async function updateServiceFee(id: number, input: UpdateServiceFeeInput) {
  const fee = await getServiceFeeById(id);

  if (input.name !== undefined) {
    await assertNameAvailable(fee.buildingId, input.name, id);
  }

  return prisma.buildingServiceFee.update({ where: { id }, data: input, select: feeSelect });
}

export async function retireServiceFee(id: number) {
  await getServiceFeeById(id);
  // Deliberately no check for leases using it: each holds its own copy of the
  // amount, so retiring changes what may be agreed next, not what was agreed.
  return prisma.buildingServiceFee.update({
    where: { id },
    data: { isActive: false },
    select: feeSelect,
  });
}

export async function restoreServiceFee(id: number) {
  const fee = await getServiceFeeById(id);

  // Retiring released the name, so another offered fee may have taken it since.
  await assertNameAvailable(fee.buildingId, fee.name, fee.id);

  return prisma.buildingServiceFee.update({
    where: { id },
    data: { isActive: true },
    select: feeSelect,
  });
}

// ── A lease's selections ─────────────────────────────────────────────────────

const selectionSelect = {
  id: true,
  leaseId: true,
  buildingServiceFeeId: true,
  unitAmount: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
  buildingServiceFee: { select: { id: true, name: true, isActive: true } },
} as const;

async function getLeaseOrThrow(leaseId: number) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { room: { select: { buildingId: true } } },
  });
  if (!lease) throw new NotFoundError("Lease not found");
  return lease;
}

export async function listLeaseServiceFees(leaseId: number) {
  await getLeaseOrThrow(leaseId);
  return prisma.leaseServiceFee.findMany({
    where: { leaseId },
    select: selectionSelect,
    orderBy: { id: "asc" },
  });
}

/**
 * Records the fee at the amount current right now.
 *
 * The copy is the whole point: this lease is agreeing to a price, and repricing
 * the building's fee afterwards must not reach back into it — the same rule the
 * lease already follows for its rent. It is also what makes retiring a fee
 * harmless, since nothing has to be resolved at billing time.
 */
export async function selectServiceFee(leaseId: number, input: SelectServiceFeeInput) {
  const lease = await getLeaseOrThrow(leaseId);
  const fee = await getServiceFeeById(input.buildingServiceFeeId);

  if (fee.buildingId !== lease.room.buildingId) {
    throw new ValidationError("That fee belongs to a different building");
  }
  if (!fee.isActive) {
    throw new ValidationError("That fee is no longer offered");
  }

  const existing = await prisma.leaseServiceFee.findFirst({
    where: { leaseId, buildingServiceFeeId: fee.id },
  });
  if (existing) {
    throw new ConflictError(
      "This lease already has that fee — change its quantity rather than adding it again",
    );
  }

  return prisma.leaseServiceFee.create({
    data: {
      leaseId,
      buildingServiceFeeId: fee.id,
      unitAmount: fee.unitAmount,
      quantity: input.quantity,
    },
    select: selectionSelect,
  });
}

async function getSelectionOrThrow(leaseId: number, selectionId: number) {
  const selection = await prisma.leaseServiceFee.findFirst({
    where: { id: selectionId, leaseId },
    select: selectionSelect,
  });
  if (!selection) throw new NotFoundError("Lease service fee not found");
  return selection;
}

/**
 * Writes the quantity and nothing else.
 *
 * Deliberately does NOT re-read the building's fee. A tenant who buys a second
 * motorbike has not renegotiated the price of the first, and re-copying here
 * would reprice their existing bike silently — the failure is invisible in the
 * total, which merely looks larger because the quantity grew.
 */
export async function updateLeaseServiceFee(
  leaseId: number,
  selectionId: number,
  input: UpdateSelectionInput,
) {
  await getLeaseOrThrow(leaseId);
  await getSelectionOrThrow(leaseId, selectionId);

  return prisma.leaseServiceFee.update({
    where: { id: selectionId },
    data: { quantity: input.quantity },
    select: selectionSelect,
  });
}

export async function removeLeaseServiceFee(leaseId: number, selectionId: number) {
  await getLeaseOrThrow(leaseId);
  await getSelectionOrThrow(leaseId, selectionId);
  await prisma.leaseServiceFee.delete({ where: { id: selectionId } });
}
