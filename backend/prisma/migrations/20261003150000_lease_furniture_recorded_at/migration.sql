-- Tells "handed over with nothing" apart from "nobody ever recorded one".
--
-- Both show zero furniture rows. Only one of them is a statement about what
-- happened, and every tenancy signed before this feature existed is the other.
--
-- Nullable with NO backfill, deliberately: leaving the existing rows NULL is
-- precisely the fact being recorded about them.
ALTER TABLE "Lease" ADD COLUMN "furnitureRecordedAt" TIMESTAMP(3);
