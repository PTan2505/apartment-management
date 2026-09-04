import { prisma } from "@/lib/prisma.js";
import type { Prisma } from "@/generated/prisma/client.js";

/** A Prisma client or an interactive transaction client. */
type Db = typeof prisma | Prisma.TransactionClient;

export interface KnownReading {
  reading: number;
  /** When this reading was taken, used to pick the most recent. */
  at: Date;
  source: "room_initial" | "lease_start" | "lease_end" | "vacancy";
}

/**
 * A room's meter position is recorded in four places: the reading the room was
 * created at, the reading a lease opened from, the reading it closed at, and
 * the closing reading of any vacancy expense recorded while the room stood
 * empty. The most recent of them is the room's current position.
 *
 * All four matter. Without vacancy readings a new lease would default to the
 * previous lease's closing reading and re-charge the incoming tenant for
 * consumption the owner has already paid for and recorded. Without the room's
 * own opening reading, a room that has never been let has no position at all —
 * so the months it stands empty before its first tenancy produce electricity
 * the owner pays for and cannot record anywhere.
 *
 * The room's reading is a dated CANDIDATE like the others, not a fallback
 * consulted when they come back empty. Same answer today either way; the
 * difference is that a fallback is a second code path free to disagree with
 * the first — a room created in March and back-dated a January tenancy would
 * resolve differently under the two. Ordering by date is the rule this
 * function already applies, and applying it uniformly is what keeps the answer
 * explainable.
 */
export async function findLatestKnownReading(
  roomId: number,
  db: Db = prisma,
): Promise<KnownReading | null> {
  const [room, lease, vacancy] = await Promise.all([
    db.room.findUnique({
      where: { id: roomId },
      select: { createdAt: true, initialMeterReading: true },
    }),
    db.lease.findFirst({
      where: { roomId },
      orderBy: { startDate: "desc" },
      select: { startDate: true, startMeterReading: true, moveOutDate: true, endMeterReading: true },
    }),
    db.expense.findFirst({
      where: { roomId, category: "vacancy_electricity", currentReading: { not: null } },
      orderBy: { incurredAt: "desc" },
      select: { incurredAt: true, currentReading: true },
    }),
  ]);

  const candidates: KnownReading[] = [];

  // Dated at the room's creation, so any tenancy or vacancy reading — always
  // later — wins automatically. On a never-let room it is the only candidate,
  // which is the case it exists for.
  //
  // `!== null` rather than a truthiness check: zero is a stated reading, and
  // treating it as absent is exactly the conflation this column avoids.
  if (room?.initialMeterReading != null) {
    candidates.push({
      reading: room.initialMeterReading,
      at: room.createdAt,
      source: "room_initial",
    });
  }

  if (lease) {
    candidates.push({
      reading: lease.startMeterReading,
      at: lease.startDate,
      source: "lease_start",
    });
    if (lease.endMeterReading !== null && lease.moveOutDate !== null) {
      candidates.push({
        reading: lease.endMeterReading,
        at: lease.moveOutDate,
        source: "lease_end",
      });
    }
  }

  if (vacancy?.currentReading !== null && vacancy?.currentReading !== undefined) {
    candidates.push({
      reading: vacancy.currentReading,
      at: vacancy.incurredAt,
      source: "vacancy",
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((latest, c) => (c.at > latest.at ? c : latest));
}
