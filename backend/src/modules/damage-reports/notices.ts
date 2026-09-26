import { prisma } from "@/lib/prisma.js";
import { sendToUsers } from "@/lib/live.js";
import type { Prisma } from "@/generated/prisma/client.js";

/**
 * Who should be told when a report arrives in a building.
 *
 * The staff covering it AT THAT MOMENT, and every owner. Recipients are a
 * snapshot on purpose: somebody assigned to the building afterwards gets no
 * notice for what came before they covered it — those reports are on the
 * report screen, which is where outstanding work lives. A notice answers
 * "what happened while I was away".
 */
export async function recipientsFor(
  tx: Prisma.TransactionClient,
  buildingId: number,
): Promise<number[]> {
  const [staff, owners] = await Promise.all([
    tx.staffBuilding.findMany({
      where: { buildingId, user: { isActive: true } },
      select: { userId: true },
    }),
    tx.user.findMany({ where: { role: "owner", isActive: true }, select: { id: true } }),
  ]);

  return [...new Set([...staff.map((row) => row.userId), ...owners.map((row) => row.id)])];
}

/**
 * Writes a notice for each recipient, in the caller's transaction.
 *
 * In the transaction because a notice about a report that a failed write rolled
 * back is a notice about something that never happened.
 */
export async function writeNotices(
  tx: Prisma.TransactionClient,
  reportId: number,
  userIds: number[],
): Promise<void> {
  if (userIds.length === 0) return;
  await tx.reportNotice.createMany({
    data: userIds.map((userId) => ({ userId, reportId })),
    skipDuplicates: true,
  });
}

/**
 * Pushes the event, AFTER the transaction has committed.
 *
 * Carries an id, a room and a time — enough to say what arrived and to open
 * it. Everything else the client asks the API for, so there is one
 * serialisation of a report and one place that decides what a role may see.
 */
export function announce(
  userIds: number[],
  report: { id: number; roomCode: string; buildingName: string; reportedAt: Date },
): void {
  sendToUsers(userIds, {
    type: "report.new",
    id: report.id,
    roomCode: report.roomCode,
    buildingName: report.buildingName,
    reportedAt: report.reportedAt.toISOString(),
  });
}

/** How many notices this account has not read. */
export async function unreadCount(userId: number): Promise<number> {
  return prisma.reportNotice.count({ where: { userId, readAt: null } });
}

/**
 * This account's notices, newest first.
 *
 * Each carries the state of the report it announces, so one already dealt with
 * says so rather than disappearing: a list that erases what was handled cannot
 * answer "was anything reported while I was away".
 */
export async function listNotices(userId: number, limit: number) {
  const rows = await prisma.reportNotice.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      createdAt: true,
      readAt: true,
      report: {
        select: {
          id: true,
          description: true,
          state: true,
          reportedAt: true,
          lease: {
            select: {
              room: {
                select: { roomCode: true, building: { select: { id: true, displayName: true } } },
              },
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    readAt: row.readAt,
    report: {
      id: row.report.id,
      description: row.report.description,
      state: row.report.state,
      reportedAt: row.report.reportedAt,
      roomCode: row.report.lease.room.roomCode,
      building: row.report.lease.room.building,
    },
  }));
}

/**
 * Marks this account's notices read — and nobody else's.
 *
 * An act of its own rather than a side effect of fetching the list: the
 * application refetches in the background, and a count that cleared itself
 * then would clear while nobody was looking.
 */
export async function markAllRead(userId: number): Promise<{ read: number }> {
  const result = await prisma.reportNotice.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
  return { read: result.count };
}
