-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "occupantCount" INTEGER NOT NULL,
    "moveOutDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseOccupant" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseOccupant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lease_roomId_idx" ON "Lease"("roomId");

-- CreateIndex
CREATE INDEX "LeaseOccupant_leaseId_idx" ON "LeaseOccupant"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseOccupant_userId_idx" ON "LeaseOccupant"("userId");

-- CreateIndex
-- A room has at most one ACTIVE lease. Prisma's @@unique cannot express a
-- WHERE clause, so this partial index is maintained by hand.
CREATE UNIQUE INDEX "Lease_roomId_active_key" ON "Lease"("roomId") WHERE "moveOutDate" IS NULL;

-- CreateIndex
-- A lease has at most one ACTIVE primary occupant (the signatory). Note this
-- cannot enforce "at least one" — that is guaranteed by creating the lease and
-- its primary occupant in one transaction.
CREATE UNIQUE INDEX "LeaseOccupant_leaseId_primary_active_key" ON "LeaseOccupant"("leaseId") WHERE "isPrimary" = true AND "leftAt" IS NULL;

-- CreateIndex
-- A person is not a current occupant of the same lease twice, while still
-- allowing them to be re-added after they have departed.
CREATE UNIQUE INDEX "LeaseOccupant_leaseId_userId_active_key" ON "LeaseOccupant"("leaseId", "userId") WHERE "leftAt" IS NULL;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseOccupant" ADD CONSTRAINT "LeaseOccupant_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseOccupant" ADD CONSTRAINT "LeaseOccupant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
