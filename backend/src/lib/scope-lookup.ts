import { prisma } from "@/lib/prisma.js";

/**
 * Which building each kind of record belongs to.
 *
 * One file, because the answer is a chain of relations and the chain is the
 * thing worth reading in one place: an invoice reaches its building through a
 * tenancy and a room, a payment through an invoice as well. Written out
 * separately per kind rather than derived, so the path is visible where it is
 * used to decide who may see what.
 *
 * `null` means no such record — the caller treats that exactly as it treats a
 * record in somebody else's building.
 */
export async function leaseBuildingId(id: number): Promise<number | null> {
  const row = await prisma.lease.findUnique({
    where: { id },
    select: { room: { select: { buildingId: true } } },
  });
  return row?.room.buildingId ?? null;
}

export async function invoiceBuildingId(id: number): Promise<number | null> {
  const row = await prisma.invoice.findUnique({
    where: { id },
    select: { lease: { select: { room: { select: { buildingId: true } } } } },
  });
  return row?.lease.room.buildingId ?? null;
}

export async function paymentBuildingId(id: number): Promise<number | null> {
  const row = await prisma.payment.findUnique({
    where: { id },
    select: { invoice: { select: { lease: { select: { room: { select: { buildingId: true } } } } } } },
  });
  return row?.invoice.lease.room.buildingId ?? null;
}

export async function roomBuildingId(id: number): Promise<number | null> {
  const row = await prisma.room.findUnique({ where: { id }, select: { buildingId: true } });
  return row?.buildingId ?? null;
}

/**
 * A customer belongs to no building, so this answers a different question:
 * whether the caller may see this person at all.
 *
 * Somebody who has lived in one of the caller's buildings, or who has never
 * had a tenancy anywhere. The second is not an oversight: a newly registered
 * person has no tenancy yet, and the staff member who has just registered them
 * must be able to open them and sign one. It is also the pool the signing form
 * searches, and one person may hold only one room at a time, so an unhoused
 * person is nobody else's tenant.
 */
export async function customerVisibleTo(id: number, buildingIds: number[]): Promise<boolean> {
  const row = await prisma.user.findFirst({
    where: {
      id,
      OR: [
        { leaseOccupants: { some: { lease: { room: { buildingId: { in: buildingIds } } } } } },
        { leaseOccupants: { none: {} } },
      ],
    },
    select: { id: true },
  });
  return row !== null;
}
