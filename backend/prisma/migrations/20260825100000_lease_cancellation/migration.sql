-- When the owner gave up on a tenancy that never took place. Nullable, no
-- backfill: every existing lease is running or finalized, and an empty column
-- says exactly that.
ALTER TABLE "Lease" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- The room's one-active-lease slot must let a cancelled tenancy go.
--
-- A cancelled lease has no move-out date, so under the old predicate it kept
-- holding the room in the DATABASE even once every service guard had been
-- taught to ignore it — re-letting the room would have failed on a unique
-- constraint rather than on any rule anybody wrote.
DROP INDEX "Lease_roomId_active_key";
CREATE UNIQUE INDEX "Lease_roomId_active_key" ON "Lease"("roomId")
  WHERE "moveOutDate" IS NULL AND "cancelledAt" IS NULL;
