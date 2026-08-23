-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'bank_transfer');

-- AlterTable
ALTER TABLE "Lease" ADD COLUMN     "endMeterReading" INTEGER,
ADD COLUMN     "startMeterReading" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "previousElectricityUse" INTEGER NOT NULL,
    "currentElectricityUse" INTEGER NOT NULL,
    "electricityRate" DECIMAL(12,4) NOT NULL,
    "waterRatePerPerson" DECIMAL(12,4) NOT NULL,
    "baseRent" DECIMAL(12,2) NOT NULL,
    "occupantCount" INTEGER NOT NULL,
    "rentAmount" DECIMAL(14,0) NOT NULL,
    "electricityAmount" DECIMAL(14,0) NOT NULL,
    "waterAmount" DECIMAL(14,0) NOT NULL,
    "totalAmount" DECIMAL(14,0) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "paymentMethod" "PaymentMethod",
    "paidAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_leaseId_idx" ON "Invoice"("leaseId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- CreateIndex
-- One NON-VOIDED invoice per lease per month. Prisma's @@unique cannot express
-- a WHERE clause; the partial predicate is what lets a voided invoice be
-- replaced without deleting the original record.
CREATE UNIQUE INDEX "Invoice_leaseId_year_month_active_key" ON "Invoice"("leaseId", "year", "month") WHERE "voidedAt" IS NULL;
