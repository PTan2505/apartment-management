-- CreateTable
CREATE TABLE "BuildingServiceFee" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "unitAmount" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingServiceFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaseServiceFee" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "buildingServiceFeeId" INTEGER NOT NULL,
    "unitAmount" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaseServiceFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildingServiceFee_buildingId_idx" ON "BuildingServiceFee"("buildingId");

-- CreateIndex
CREATE INDEX "LeaseServiceFee_leaseId_idx" ON "LeaseServiceFee"("leaseId");

-- CreateIndex
CREATE INDEX "LeaseServiceFee_buildingServiceFeeId_idx" ON "LeaseServiceFee"("buildingServiceFeeId");

-- AddForeignKey
ALTER TABLE "BuildingServiceFee" ADD CONSTRAINT "BuildingServiceFee_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseServiceFee" ADD CONSTRAINT "LeaseServiceFee_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaseServiceFee" ADD CONSTRAINT "LeaseServiceFee_buildingServiceFeeId_fkey" FOREIGN KEY ("buildingServiceFeeId") REFERENCES "BuildingServiceFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Prisma's @@unique cannot express a WHERE clause, so both of these are added
-- by hand — the same reason Room.roomCode and LeaseOccupant carry theirs here.

-- A fee's name is unique among a building's OFFERED fees. Two entries called
-- "Parking" in one building cannot be told apart at the moment of selecting
-- one, which is the moment it matters. A retired fee releases its name, and the
-- same name in another building is fine.
CREATE UNIQUE INDEX "BuildingServiceFee_buildingId_name_active_key"
  ON "BuildingServiceFee"("buildingId", "name") WHERE "isActive" = true;

-- A lease selects a given fee at most once. Using more of a service is a
-- quantity, not a second selection — two rows for parking would double-charge
-- and leave no single row to change the quantity on.
CREATE UNIQUE INDEX "LeaseServiceFee_leaseId_fee_key"
  ON "LeaseServiceFee"("leaseId", "buildingServiceFeeId");
