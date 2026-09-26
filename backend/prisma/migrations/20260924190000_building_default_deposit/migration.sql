-- How many months of rent a tenancy signed in this building takes as a deposit.
--
-- NOT NULL with a default, so every existing building is backfilled at one
-- month — the common arrangement here, and a figure the owner can correct on
-- the building screen. A nullable column would have left every reader deciding
-- what "unstated" means.

ALTER TABLE "Building" ADD COLUMN "defaultDepositMonths" INTEGER NOT NULL DEFAULT 1;
