-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "electricityRate" DECIMAL(12,4) NOT NULL,
    "waterRatePerPerson" DECIMAL(12,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "baseRent" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Room_buildingId_idx" ON "Room"("buildingId");

-- CreateIndex
-- Room codes are unique only among ACTIVE rooms in a building, so retiring a
-- room frees its code for reuse. Prisma's @@unique cannot express the WHERE
-- clause, so this partial index is maintained by hand.
CREATE UNIQUE INDEX "Room_buildingId_roomCode_active_key" ON "Room"("buildingId", "roomCode") WHERE "isActive" = true;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
