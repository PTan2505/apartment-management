-- What a service fee's amount is multiplied by, and whether new tenancies take
-- it up on their own.
--
-- Every existing row becomes perRoom and not automatic, which is exactly what
-- it is today: the column defaults do the backfill, so no data migration.

CREATE TYPE "ServiceFeeBasis" AS ENUM ('perRoom', 'perPerson');

ALTER TABLE "BuildingServiceFee"
  ADD COLUMN "basis" "ServiceFeeBasis" NOT NULL DEFAULT 'perRoom',
  ADD COLUMN "appliedByDefault" BOOLEAN NOT NULL DEFAULT false;

-- Copied onto the tenancy's selection, like unitAmount: repricing or re-basing
-- the catalogue must not disturb an agreement already made.
ALTER TABLE "LeaseServiceFee"
  ADD COLUMN "basis" "ServiceFeeBasis" NOT NULL DEFAULT 'perRoom';
