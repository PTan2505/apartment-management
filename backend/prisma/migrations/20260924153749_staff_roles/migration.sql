-- Two more roles, the buildings a member of staff covers, and the two facts an
-- account needs about itself: whether it may still sign in, and whether the
-- password it holds was issued by somebody else.

ALTER TYPE "Role" ADD VALUE 'manager';
ALTER TYPE "Role" ADD VALUE 'maintenance';

ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "StaffBuilding" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffBuilding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffBuilding_userId_buildingId_key" ON "StaffBuilding"("userId", "buildingId");
CREATE INDEX "StaffBuilding_buildingId_idx" ON "StaffBuilding"("buildingId");

ALTER TABLE "StaffBuilding" ADD CONSTRAINT "StaffBuilding_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffBuilding" ADD CONSTRAINT "StaffBuilding_buildingId_fkey"
    FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;
