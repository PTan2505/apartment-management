-- The deposit a lease actually holds, as distinct from the one its terms agreed.
-- Every column defaults or is nullable, so no existing row changes meaning: a
-- lease that has never been touched by this feature holds zero, which is what
-- it held before the columns existed.
ALTER TABLE "Lease" ADD COLUMN "depositHeld"       DECIMAL(14,0) NOT NULL DEFAULT 0;
ALTER TABLE "Lease" ADD COLUMN "depositCarriedIn"  DECIMAL(14,0) NOT NULL DEFAULT 0;
ALTER TABLE "Lease" ADD COLUMN "depositCarriedOut" DECIMAL(14,0) NOT NULL DEFAULT 0;
ALTER TABLE "Lease" ADD COLUMN "depositRefunded"   DECIMAL(14,0);
ALTER TABLE "Lease" ADD COLUMN "depositRefundedAt" TIMESTAMP(3);
ALTER TABLE "Lease" ADD COLUMN "depositNote"       TEXT;

-- Settling a bill out of the deposit already held.
ALTER TYPE "PaymentMethod" ADD VALUE 'deposit_deduction';
