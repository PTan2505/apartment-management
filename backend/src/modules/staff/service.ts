import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma.js";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors.js";
import { generateInitialPassword } from "./password.js";
import type {
  AssignBuildingsInput,
  CreateStaffInput,
  ListStaffQuery,
  UpdateStaffInput,
} from "./schema.js";

/**
 * The same cost the seed script and the login path use. Stated here rather
 * than imported from either, because both are about a password somebody chose
 * and this is about one nobody did — the cost is the same, the reason is not.
 */
const BCRYPT_ROUNDS = 10;

/**
 * What a staff account looks like to the owner. No password, in any form:
 * there is nothing to show, which is the point of storing it hashed.
 */
const staffSelect = {
  id: true,
  phone: true,
  fullName: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  staffBuildings: {
    select: { building: { select: { id: true, displayName: true } } },
    orderBy: { buildingId: "asc" as const },
  },
} as const;

type StaffRow = {
  staffBuildings: { building: { id: number; displayName: string } }[];
};

function toStaff<T extends StaffRow>({ staffBuildings, ...staff }: T) {
  return { ...staff, buildings: staffBuildings.map((row) => row.building) };
}

async function findStaffOrThrow(id: number) {
  const staff = await prisma.user.findFirst({
    where: { id, role: { in: ["manager", "maintenance"] } },
    select: staffSelect,
  });
  if (!staff) {
    throw new NotFoundError("STAFF_NOT_FOUND", "Staff account not found");
  }
  return staff;
}

async function assertPhoneFree(phone: string, exceptId?: number) {
  const clash = await prisma.user.findFirst({
    where: { phone, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) {
    throw new ConflictError("PHONE_ALREADY_IN_USE", "That phone number already belongs to somebody");
  }
}

/** Refuses building ids that do not exist, so an assignment cannot point at nothing. */
async function assertBuildingsExist(buildingIds: number[]) {
  if (buildingIds.length === 0) return;
  const found = await prisma.building.count({ where: { id: { in: buildingIds } } });
  if (found !== new Set(buildingIds).size) {
    throw new ValidationError("BUILDING_NOT_FOUND", "One of those buildings does not exist");
  }
}

/**
 * Creates a staff account and returns its password ONCE.
 *
 * The password is generated rather than accepted: one an owner chooses is one
 * they will reuse, and one they can look up afterwards is one the system is
 * keeping in readable form. It is hashed here and never stored otherwise, so
 * this response is the only place it will ever appear.
 */
export async function createStaff(input: CreateStaffInput) {
  await assertPhoneFree(input.phone);
  await assertBuildingsExist(input.buildingIds ?? []);

  const password = generateInitialPassword();

  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        phone: input.phone,
        fullName: input.fullName,
        // The account holds a name the customer module derives for searching.
        // Staff are never searched by folded name, but the column is not
        // nullable and a lie there would be worse than a duplicate.
        fullNameSearch: input.fullName.toLowerCase(),
        role: input.role,
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        mustChangePassword: true,
      },
      select: { id: true },
    });

    if (input.buildingIds?.length) {
      await tx.staffBuilding.createMany({
        data: input.buildingIds.map((buildingId) => ({ userId: created.id, buildingId })),
      });
    }

    return created;
  });

  return { staff: toStaff(await findStaffOrThrow(staff.id)), password };
}

export async function listStaff(query: ListStaffQuery) {
  const rows = await prisma.user.findMany({
    where: {
      role: query.role ? query.role : { in: ["manager", "maintenance"] },
      ...(query.status === "all" ? {} : { isActive: query.status === "active" }),
    },
    select: staffSelect,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toStaff);
}

export async function getStaffById(id: number) {
  return toStaff(await findStaffOrThrow(id));
}

export async function updateStaff(id: number, input: UpdateStaffInput) {
  await findStaffOrThrow(id);
  if (input.phone) {
    await assertPhoneFree(input.phone, id);
  }
  await prisma.user.update({
    where: { id },
    data: {
      ...(input.fullName ? { fullName: input.fullName, fullNameSearch: input.fullName.toLowerCase() } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
    },
  });
  return toStaff(await findStaffOrThrow(id));
}

/**
 * Replaces the whole assignment rather than adding to it.
 *
 * The owner's screen shows a set and sends a set; a partial update would make
 * "these are the buildings they cover" a claim the screen could not make from
 * one request.
 */
export async function assignBuildings(id: number, input: AssignBuildingsInput) {
  await findStaffOrThrow(id);
  await assertBuildingsExist(input.buildingIds);

  await prisma.$transaction(async (tx) => {
    await tx.staffBuilding.deleteMany({
      where: { userId: id, buildingId: { notIn: input.buildingIds } },
    });
    // `createMany` with `skipDuplicates`, so re-sending the same set is a
    // no-op rather than a unique-constraint failure.
    if (input.buildingIds.length) {
      await tx.staffBuilding.createMany({
        data: input.buildingIds.map((buildingId) => ({ userId: id, buildingId })),
        skipDuplicates: true,
      });
    }
  });

  return toStaff(await findStaffOrThrow(id));
}

/**
 * A new password, shown once, and the account owes a change again.
 *
 * Every session is revoked with it: the password is being replaced because
 * nobody knows what became of the old one, and a session opened with it would
 * outlive the replacement.
 */
export async function resetPassword(id: number) {
  await findStaffOrThrow(id);
  const password = generateInitialPassword();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        mustChangePassword: true,
      },
    });
    await tx.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });

  return { staff: toStaff(await findStaffOrThrow(id)), password };
}

/**
 * Closed, not deleted. The repairs they scheduled and the tenancies they signed
 * name them, and removing the account would take that record with it.
 */
export async function setActive(id: number, isActive: boolean) {
  await findStaffOrThrow(id);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { isActive } });
    if (!isActive) {
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  });

  return toStaff(await findStaffOrThrow(id));
}
