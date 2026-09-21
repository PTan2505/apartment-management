-- Three terms leave the lease, and every lease gets a reference.
--
-- `noticeDays`, `paymentDay` and `startWaterReading` were accepted, stored and
-- reported — and read by nothing. No move-out consulted the notice, no invoice
-- ever carried a due date derived from the payment day, and water is billed per
-- occupant so no meter reading entered any calculation.
--
-- The water reading is why this is a deletion rather than a hidden field: it sat
-- beside an electricity reading that every invoice consumes, and a second
-- meter-looking number invites someone to reconcile a water bill against a
-- figure nothing has ever added.
--
-- Dropped rather than left in place because the hosted database holds no real
-- data yet. Three columns nothing writes and nothing reads are three questions
-- for whoever reads this schema next.

-- Back-filled FIRST, while the rest of this migration can still roll back with
-- it. A renewal opened its successor without ever setting a reference — signing
-- set one, renewing did not — so a renewed tenancy could not be named out loud.
--
-- Same shape the original back-fill used, so a reference written here and one
-- written then read alike. Only rows that have none are touched.
UPDATE "Lease" AS l
SET "reference" = 'HD-' || r."roomCode" || '-'
  || TO_CHAR(l."startDate", 'YYYY') || '-' || l."id"::text
FROM "Room" AS r
WHERE r."id" = l."roomId" AND l."reference" IS NULL;

ALTER TABLE "Lease" DROP COLUMN "noticeDays";
ALTER TABLE "Lease" DROP COLUMN "paymentDay";
ALTER TABLE "Lease" DROP COLUMN "startWaterReading";
