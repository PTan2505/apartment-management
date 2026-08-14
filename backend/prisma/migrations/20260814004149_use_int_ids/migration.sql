-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_roomId_fkey";

-- DropForeignKey
ALTER TABLE "LeaseOccupant" DROP CONSTRAINT "LeaseOccupant_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "LeaseOccupant" DROP CONSTRAINT "LeaseOccupant_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "Room" DROP CONSTRAINT "Room_buildingId_fkey";

-- AlterTable
ALTER TABLE "Building" DROP CONSTRAINT "Building_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Building_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "roomId",
ADD COLUMN     "roomId" INTEGER NOT NULL,
ADD CONSTRAINT "Lease_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "LeaseOccupant" DROP CONSTRAINT "LeaseOccupant_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "leaseId",
ADD COLUMN     "leaseId" INTEGER NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "LeaseOccupant_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" INTEGER NOT NULL,
ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Room" DROP CONSTRAINT "Room_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "buildingId",
ADD COLUMN     "buildingId" INTEGER NOT NULL,
ADD CONSTRAINT "Room_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE INDEX "Lease_roomId_idx" ON "Lease"("roomId");

-- CreateIndex
CREATE INDEX "LeaseOccupant_leaseId_idx" ON "LeaseOccupant"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseOccupant_userId_idx" ON "LeaseOccupant"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Room_buildingId_idx" ON "Room"("buildingId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseOccupant" ADD CONSTRAINT "LeaseOccupant_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseOccupant" ADD CONSTRAINT "LeaseOccupant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Re-create the hand-maintained PARTIAL unique indexes.
-- Changing the id/FK column types above drops these along with their columns,
-- and `prisma migrate diff` cannot regenerate them because Prisma's @@unique
-- has no WHERE clause. Without this block the integrity backstops for room
-- codes, active leases, and occupants would be silently lost.
-- ---------------------------------------------------------------------------

-- Room codes are unique only among ACTIVE rooms, so retiring a room frees its code.
CREATE UNIQUE INDEX "Room_buildingId_roomCode_active_key" ON "Room"("buildingId", "roomCode") WHERE "isActive" = true;

-- A room has at most one ACTIVE lease.
CREATE UNIQUE INDEX "Lease_roomId_active_key" ON "Lease"("roomId") WHERE "moveOutDate" IS NULL;

-- A lease has at most one ACTIVE primary occupant (the signatory).
CREATE UNIQUE INDEX "LeaseOccupant_leaseId_primary_active_key" ON "LeaseOccupant"("leaseId") WHERE "isPrimary" = true AND "leftAt" IS NULL;

-- A person is not a current occupant of the same lease twice.
CREATE UNIQUE INDEX "LeaseOccupant_leaseId_userId_active_key" ON "LeaseOccupant"("leaseId", "userId") WHERE "leftAt" IS NULL;
