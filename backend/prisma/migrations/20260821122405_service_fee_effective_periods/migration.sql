-- Gives a lease's service fees an effective period, so "which fees applied
-- during this month" can be answered for an invoice generated late.
--
-- Modelled on LeaseOccupant (joinedAt / leftAt / partial unique on the active
-- rows), which already solves exactly this shape for people on a lease.
--
-- Order matters: add nullable, backfill, then require. The columns are NOT NULL
-- and the table may hold rows.

ALTER TABLE "LeaseServiceFee" ADD COLUMN "effectiveFrom" TIMESTAMP(3);
ALTER TABLE "LeaseServiceFee" ADD COLUMN "effectiveTo"   TIMESTAMP(3);

-- Every existing row was selected when its lease was created, so it applied
-- from the tenancy's first day. That is the only defensible value; using the
-- row's own createdAt would claim the fee started whenever it was typed in.
UPDATE "LeaseServiceFee" sf
SET "effectiveFrom" = l."startDate"
FROM "Lease" l
WHERE l.id = sf."leaseId";

ALTER TABLE "LeaseServiceFee" ALTER COLUMN "effectiveFrom" SET NOT NULL;

-- The old index forbade a lease ever holding a fee twice, which also forbade
-- giving one up and taking it again. Uniqueness now applies only to the fees
-- still running.
DROP INDEX "LeaseServiceFee_leaseId_fee_key";
CREATE UNIQUE INDEX "LeaseServiceFee_leaseId_fee_active_key"
  ON "LeaseServiceFee"("leaseId", "buildingServiceFeeId") WHERE "effectiveTo" IS NULL;

-- A service fee line records which catalogue fee it came from, so a report can
-- group by kind of fee without parsing text. Null for rent, electricity, water.
ALTER TYPE "InvoiceLineKind" ADD VALUE 'serviceFee';

ALTER TABLE "InvoiceLineItem" ADD COLUMN "buildingServiceFeeId" INTEGER;
ALTER TABLE "InvoiceLineItem"
  ADD CONSTRAINT "InvoiceLineItem_buildingServiceFeeId_fkey"
  FOREIGN KEY ("buildingServiceFeeId") REFERENCES "BuildingServiceFee"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
