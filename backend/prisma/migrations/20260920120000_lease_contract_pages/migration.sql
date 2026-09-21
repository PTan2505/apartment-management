-- A contract becomes the pages it is.
--
-- One nullable key on the lease meant one file per tenancy. A signed agreement
-- is several pages of paper, so an owner photographing a four-page contract had
-- to assemble a document somewhere else before this system would take it — and
-- a single opaque "file" is why the screen could only report that a contract
-- exists instead of showing it.
--
-- The key is UNIQUE: two rows pointing at one object would let removing either
-- delete bytes the other still claims.

CREATE TABLE "LeaseContractPage" (
  "id"          SERIAL PRIMARY KEY,
  "leaseId"     INTEGER NOT NULL,
  "key"         TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "uploadedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "LeaseContractPage_key_key" ON "LeaseContractPage"("key");
CREATE INDEX "LeaseContractPage_leaseId_uploadedAt_idx" ON "LeaseContractPage"("leaseId", "uploadedAt");

ALTER TABLE "LeaseContractPage" ADD CONSTRAINT "LeaseContractPage_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing attachments are NOT carried over, and the objects are left in
-- storage rather than deleted here.
--
-- The hosted database has none, so nothing a user recorded is lost. What exists
-- locally is test data, and much of it is PDFs — a type these pages no longer
-- accept, so carrying it across would create rows the new rules refuse the
-- moment anything touches them. Better to lose a test attachment than to seed a
-- table with rows that are invalid on arrival.
ALTER TABLE "Lease" DROP COLUMN "contractKey";
