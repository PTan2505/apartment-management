-- AlterTable
-- `country` carries a default, so it can be added NOT NULL directly.
ALTER TABLE "Building" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Vietnam';

-- `ward` and `city` are required but have no sensible default, so they are added
-- nullable, backfilled, then constrained. Adding them NOT NULL in one step would
-- fail against any existing row.
ALTER TABLE "Building" ADD COLUMN "ward" TEXT;
ALTER TABLE "Building" ADD COLUMN "city" TEXT;

UPDATE "Building" SET "ward" = 'Thủ Đức', "city" = 'Hồ Chí Minh' WHERE "ward" IS NULL;

ALTER TABLE "Building" ALTER COLUMN "ward" SET NOT NULL;
ALTER TABLE "Building" ALTER COLUMN "city" SET NOT NULL;
