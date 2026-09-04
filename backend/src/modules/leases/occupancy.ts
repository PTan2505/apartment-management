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
