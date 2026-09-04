import { prisma } from "@/lib/prisma.js";
import { paginate, toSkipTake } from "@/lib/pagination.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import type {
  CreateServiceFeeInput,
  EndServiceFeeInput,
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
  if (!building) throw new NotFoundError("BUILDING_NOT_FOUND", "Building not found");
  return building;
}

export async function getServiceFeeById(id: number) {
  const fee = await prisma.buildingServiceFee.findUnique({ where: { id }, select: feeSelect });
  if (!fee) throw new NotFoundError("SERVICE_FEE_NOT_FOUND", "Service fee not found");
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
    throw new ConflictError(
      "SERVICE_FEE_NAME_TAKEN",
      `This building already has a fee named "${name}"`,
    );
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
  effectiveFrom: true,
  effectiveTo: true,
  createdAt: true,
  updatedAt: true,
  buildingServiceFee: { select: { id: true, name: true, isActive: true } },
} as const;

async function getLeaseOrThrow(leaseId: number) {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: { room: { select: { buildingId: true } } },
  });
  if (!lease) throw new NotFoundError("LEASE_NOT_FOUND", "Lease not found");
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
    throw new ValidationError("SERVICE_FEE_WRONG_BUILDING", "That fee belongs to a different building");
  }
  if (!fee.isActive) {
    throw new ValidationError("SERVICE_FEE_WITHDRAWN", "That fee is no longer offered");
  }

  // Only the fees still running block a new one. A fee given up may be taken
  // again — that is a second period, not a duplicate.
  const existing = await prisma.leaseServiceFee.findFirst({
    where: { leaseId, buildingServiceFeeId: fee.id, effectiveTo: null },
  });
  if (existing) {
    throw new ConflictError(
      "SERVICE_FEE_ALREADY_ON_LEASE",
      "This lease already has that fee — change its quantity rather than adding it again",
    );
  }

  // Defaults to the lease's start, not to today: a fee agreed at signing
  // applied from day one, and dating it from whenever the owner typed it in
  // would silently under-charge every fee entered late.
  const effectiveFrom = input.effectiveFrom ?? lease.startDate;
  if (effectiveFrom < lease.startDate) {
    throw new ValidationError("SERVICE_FEE_STARTS_BEFORE_LEASE", "A fee cannot begin applying before its lease starts");
  }

  return prisma.leaseServiceFee.create({
    data: {
      leaseId,
      buildingServiceFeeId: fee.id,
      unitAmount: fee.unitAmount,
      quantity: input.quantity,
      effectiveFrom,
    },
    select: selectionSelect,
  });
}

async function getSelectionOrThrow(leaseId: number, selectionId: number) {
  const selection = await prisma.leaseServiceFee.findFirst({
    where: { id: selectionId, leaseId },
    select: selectionSelect,
  });
  if (!selection) throw new NotFoundError("LEASE_SERVICE_FEE_NOT_FOUND", "Lease service fee not found");
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

/**
 * Records that a lease gave a fee up, rather than deleting the record.
 *
 * A tenant who had parking for half of March had it, and an invoice generated
 * afterwards has to charge those days. Deleting would make that unanswerable
 * and would silently charge nothing — the failure looks like a correct bill.
 */
export async function endLeaseServiceFee(
  leaseId: number,
  selectionId: number,
  input: EndServiceFeeInput,
) {
  await getLeaseOrThrow(leaseId);
  const selection = await getSelectionOrThrow(leaseId, selectionId);

  if (selection.effectiveTo !== null) {
    throw new ConflictError("LEASE_SERVICE_FEE_ALREADY_ENDED", "That fee has already been given up");
  }

  const effectiveTo = input.effectiveTo ?? new Date();
  if (effectiveTo < selection.effectiveFrom) {
    throw new ValidationError("SERVICE_FEE_ENDS_BEFORE_START", "A fee cannot stop applying before it started");
  }

  return prisma.leaseServiceFee.update({
    where: { id: selectionId },
    data: { effectiveTo },
    select: selectionSelect,
  });
}
