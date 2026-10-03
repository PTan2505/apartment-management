-- Visitors staying in a room who are not on the tenancy, and the number printed
-- on an identity card.
--
-- Two separate facts in one migration because they arrive for one reason: the
-- residence form (CT01) has a box for the head of household's identity number,
-- and the system has only ever held PHOTOGRAPHS of identity cards. A photograph
-- cannot be typed into a box.

-- Nam or Nữ, as the form asks it. Two values because the form has two boxes.
CREATE TYPE "Sex" AS ENUM ('male', 'female');

-- Nullable with no backfill. Null means NOBODY HAS SAID: every person recorded
-- before now has none, and an owner entering an old paper tenancy may never
-- have been given it. Deliberately not unique — two rows carrying the same
-- number is a mistake worth finding, but a unique index turns it into a save
-- that fails on an unrelated person's record, naming neither of them.
ALTER TABLE "User" ADD COLUMN "idCardNumber" TEXT;

-- A FOURTH population, separate from the signatory, the listed occupants, and
-- the occupant count that water is billed on. Nothing here reaches billing.
--
-- "expectedUntil" is NOT NULL on purpose: the fourteen-day flag is this
-- feature's whole value, and a nullable end date is how every record quietly
-- becomes "still here, indefinitely".
CREATE TABLE "LeaseVisitor" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "idCardNumber" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "sex" "Sex" NOT NULL,
    "permanentAddress" TEXT NOT NULL,
    "relationToSignatory" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "occupation" TEXT,
    "idCardFrontKey" TEXT,
    "idCardBackKey" TEXT,
    "arrivesOn" TIMESTAMP(3) NOT NULL,
    "expectedUntil" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "addedByStaff" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseVisitor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeaseVisitor_leaseId_idx" ON "LeaseVisitor"("leaseId");

-- Cascades with the tenancy, like contract pages and damage reports: a visit is
-- somebody's guest, not the room's, and a deleted tenancy's guest log is of
-- nothing. Leases are closed rather than deleted here, so this is a safeguard
-- rather than a routine path.
ALTER TABLE "LeaseVisitor"
  ADD CONSTRAINT "LeaseVisitor_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES "Lease"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
