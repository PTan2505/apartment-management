-- A renewal records which lease it renewed.
--
-- Until now the chain was unrecoverable. Renewing closes the predecessor and
-- opens a successor beginning the same day, and nothing linked the two — so a
-- successor read exactly like a fresh tenancy that happened to start on the day
-- the previous one ended. Which is also what a DIFFERENT tenant moving in on
-- changeover day looks like, so the link could not even be inferred safely.
--
-- UNIQUE: a lease is renewed at most once. Renewing closes the predecessor, and
-- a closed lease cannot be renewed again — the index states that where it
-- cannot be bypassed, rather than only in the service that happens to enforce it.
--
-- Existing rows keep NULL. A renewal that already happened has no record of
-- having happened, and guessing from matching dates is exactly the inference
-- this column exists to replace.
ALTER TABLE "Lease" ADD COLUMN "renewedFromId" INTEGER;

CREATE UNIQUE INDEX "Lease_renewedFromId_key" ON "Lease"("renewedFromId");

ALTER TABLE "Lease" ADD CONSTRAINT "Lease_renewedFromId_fkey"
  FOREIGN KEY ("renewedFromId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
