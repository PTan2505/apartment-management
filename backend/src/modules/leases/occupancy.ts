import type { PrismaClient } from "@/generated/prisma/client.js";

/**
 * What it means for a tenancy to be holding its room.
 *
 * This existed in four places as the literal `{ moveOutDate: null }` — the
 * room's own `isLet`, the vacancy filter, the guard refusing a second lease on
 * a room, and the guard refusing to retire an occupied room. Cancellation added
 * a second way for a tenancy to stop holding a room, and the danger was never
 * that the condition is hard but that it is scattered: miss one copy and the
 * symptom is a room held by a tenancy that no longer exists, which is the exact
 * defect cancellation was built to remove, reappearing in a corner nobody
 * looks at.
 *
 * So there is now one definition and four references to it. Adding a third way
 * for a tenancy to end means editing this file and nothing else.
 *
 * The database enforces the same predicate independently, in the partial unique
 * index behind one-active-lease-per-room. Both must say the same thing: a guard
 * that permits what the index forbids turns a rule into a constraint violation.
 */
export const HOLDS_ITS_ROOM = { moveOutDate: null, cancelledAt: null } as const;

/**
 * The room a person currently lives in, or null.
 *
 * The other half of the same idea, in the same file for the same reason: this
 * question gets asked from two places — signing a tenancy and adding an
 * occupant — and a copy that drifts lets somebody be recorded in two rooms
 * through whichever door was missed. That was the defect: `addOccupant` asked
 * "is this person already in THIS lease", which is the right question of too
 * small a set, and `createLease` never asked at all. One customer reached three
 * rooms at once.
 *
 * It matters because nothing downstream is built for it. Occupant counts split
 * the electricity and water, so a person counted twice is billed twice for what
 * they used once, and the revenue report would name one person responsible for
 * two rooms. Neither surfaces as an error — each room reads correctly alone.
 *
 * WHY THIS READS THROUGH THE LEASE. `leftAt IS NULL` on its own is wrong:
 * cancelling a tenancy does not record a departure for its occupants, so those
 * rows keep a null there forever. Judging occupancy from that column alone
 * would refuse somebody whose previous tenancy never happened, citing a room
 * they never lived in.
 *
 * That is also why this is not a partial unique index, where the one-active-
 * lease-per-room rule above IS one. An index sees only the occupancy row's own
 * columns, and this condition is on the lease behind it. The trade-off is
 * stated rather than hidden: two concurrent writes can both pass this, where
 * the room rule's index would refuse the second.
 */
export async function roomOccupiedBy(
  client: Pick<PrismaClient, "leaseOccupant">,
  userId: number,
  options: { exceptLeaseId?: number } = {},
): Promise<{ leaseId: number; roomCode: string } | null> {
  const current = await client.leaseOccupant.findFirst({
    where: {
      userId,
      leftAt: null,
      lease: {
        ...HOLDS_ITS_ROOM,
        ...(options.exceptLeaseId === undefined ? {} : { id: { not: options.exceptLeaseId } }),
      },
    },
    select: { lease: { select: { id: true, room: { select: { roomCode: true } } } } },
  });

  if (!current) return null;
  return { leaseId: current.lease.id, roomCode: current.lease.room.roomCode };
}
