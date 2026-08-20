-- Adds the terms a lease agrees for itself: the rent it fixed, and the deposit
-- it was taken with.
--
-- Written as add-nullable → backfill → set NOT NULL rather than as a single
-- ADD COLUMN … NOT NULL. The database this was authored against holds no
-- leases, so the shorter form would have worked here — and would fail on any
-- database that has them. The migration has to be correct wherever it runs, not
-- only where it was written.

-- 1. Add both nullable, so existing rows are briefly allowed to be empty.
ALTER TABLE "Lease" ADD COLUMN "baseRent" DECIMAL(12,2);
ALTER TABLE "Lease" ADD COLUMN "depositMonths" INTEGER;

-- 2a. Rent backfills from the lease's room. This is not an approximation: it is
--     exactly what invoicing read for these leases before this change, so every
--     existing lease keeps being billed the same amount it was being billed.
UPDATE "Lease" l
SET "baseRent" = r."baseRent"
FROM "Room" r
WHERE r.id = l."roomId";

-- 2b. Deposit backfills to zero, and this asserts nothing. A deposit was never
--     recorded anywhere, so there is no value to recover — any figure other
--     than zero would be invented. A lease that did take a deposit in reality
--     will therefore read as zero, and that is a real loss rather than a
--     rounding: it is unavoidable because the information never existed.
UPDATE "Lease" SET "depositMonths" = 0 WHERE "depositMonths" IS NULL;

-- 3. Require both. A lease must not exist without stating its own terms.
ALTER TABLE "Lease" ALTER COLUMN "baseRent" SET NOT NULL;
ALTER TABLE "Lease" ALTER COLUMN "depositMonths" SET NOT NULL;
