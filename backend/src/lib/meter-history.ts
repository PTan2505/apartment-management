import { prisma } from "@/lib/prisma.js";
import type { Prisma } from "@/generated/prisma/client.js";

/** A Prisma client or an interactive transaction client. */
type Db = typeof prisma | Prisma.TransactionClient;

export interface KnownReading {
  reading: number;
  /** When this reading was taken, used to pick the most recent. */
  at: Date;
  source: "lease_start" | "lease_end" | "vacancy";
}

/**
 * A room's meter position is recorded in three places: the reading a lease
 * opened from, the reading it closed at, and the closing reading of any vacancy
 * expense recorded while the room stood empty. The most recent of them is the
 * room's current position.
 *
 * All three matter. Without vacancy readings a new lease would default to the
 * previous lease's closing reading and re-charge the incoming tenant for
 * consumption the owner has already paid for and recorded.
 */
export async function findLatestKnownReading(
  roomId: number,
  db: Db = prisma,
): Promise<KnownReading | null> {
  const [lease, vacancy] = await Promise.all([
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
