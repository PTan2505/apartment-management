-- A tenancy records the utility rates it was signed at, as it already records
-- the rent it was agreed at.
--
-- The backfill writes each building's CURRENT rates onto its existing
-- tenancies. That is not the rate each tenancy was actually signed at — nothing
-- ever recorded that — but it is the figure the next invoice for those
-- tenancies would have used anyway, so no tenancy changes what it bills.
ALTER TABLE "Lease" ADD COLUMN "electricityRate" DECIMAL(10,2);
ALTER TABLE "Lease" ADD COLUMN "waterRatePerPerson" DECIMAL(12,2);

UPDATE "Lease" AS l
SET "electricityRate" = b."electricityRate",
    "waterRatePerPerson" = b."waterRatePerPerson"
FROM "Room" AS r
JOIN "Building" AS b ON b."id" = r."buildingId"
WHERE r."id" = l."roomId";

ALTER TABLE "Lease" ALTER COLUMN "electricityRate" SET NOT NULL;
ALTER TABLE "Lease" ALTER COLUMN "waterRatePerPerson" SET NOT NULL;
