-- Terms of the agreement, as distinct from what it takes to bill it.
--
-- Every column NULLABLE, and null means NOT AGREED. Every lease predating this
-- migration has none of them and never will retroactively; a NOT NULL DEFAULT
-- would state a term for tenancies whose paper agreements say something else,
-- or say nothing at all. Thirty days is the common notice period — it is not
-- the notice period of a tenancy nobody asked.
--
-- startWaterReading is the sharpest case. ZERO IS A LEGITIMATE METER READING,
-- so DEFAULT 0 would make "no reading recorded" and "the meter read zero" the
-- same value — and the difference between those two is the whole substance of
-- the water dispute this column exists to settle.
ALTER TABLE "Lease" ADD COLUMN "noticeDays" INTEGER;
ALTER TABLE "Lease" ADD COLUMN "paymentDay" INTEGER;
ALTER TABLE "Lease" ADD COLUMN "startWaterReading" INTEGER;
ALTER TABLE "Lease" ADD COLUMN "handoverSignedAt" TIMESTAMP(3);
ALTER TABLE "Lease" ADD COLUMN "reference" TEXT;

-- The reference IS back-filled, and it is the only one that is.
--
-- The distinction is deliberate: a reference derived from data the lease
-- already holds NAMES an agreement that exists, while a defaulted notice period
-- would ASSERT something about what that agreement says. Naming is safe;
-- asserting is not.
--
-- Built from the room and the year it began, plus the id — which is unique by
-- construction, so the back-fill cannot collide with itself and needs no retry.
UPDATE "Lease" AS l
SET "reference" = 'HD-' || r."roomCode" || '-'
  || TO_CHAR(l."startDate", 'YYYY') || '-' || l."id"::text
FROM "Room" AS r
WHERE r."id" = l."roomId";

-- Enforced by the DATABASE rather than by the generator that produces it. A
-- generator is what races with itself; a unique index does not.
CREATE UNIQUE INDEX "Lease_reference_key" ON "Lease"("reference");
