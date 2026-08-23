-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('vacancy_electricity', 'cleaning', 'repair', 'other');

-- CreateEnum
CREATE TYPE "ExpenseOrigin" AS ENUM ('system', 'manual');

-- CreateEnum
CREATE TYPE "VacancyReconciliation" AS ENUM ('month_end', 'lease_start');

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "buildingId" INTEGER NOT NULL,
    "roomId" INTEGER,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "origin" "ExpenseOrigin" NOT NULL DEFAULT 'manual',
    "quantity" DECIMAL(14,2),
    "unitRate" DECIMAL(12,4),
    "amount" DECIMAL(14,0) NOT NULL,
    "reconciliation" "VacancyReconciliation",
    "year" INTEGER,
    "month" INTEGER,
    "previousReading" INTEGER,
    "currentReading" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_buildingId_idx" ON "Expense"("buildingId");

-- CreateIndex
CREATE INDEX "Expense_roomId_idx" ON "Expense"("roomId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- CreateIndex
-- A month end can be recorded only once per room. Turnover records are excluded
-- via the reconciliation predicate rather than a null year, because a room may
-- legitimately be re-let more than once in the same month.
CREATE UNIQUE INDEX "Expense_room_month_end_key" ON "Expense"("roomId", "year", "month")
  WHERE "category" = 'vacancy_electricity' AND "reconciliation" = 'month_end';
