-- The gateway's half of a payment.
--
-- Three new states, all of them things only a gateway can produce. `pending`
-- is the one that changes an existing assumption: until now every payment on
-- record had happened, so the cash figure could sum them without asking. From
-- here it has to ask.
ALTER TYPE "PaymentState" ADD VALUE 'pending'   BEFORE 'succeeded';
ALTER TYPE "PaymentState" ADD VALUE 'cancelled' AFTER  'succeeded';
ALTER TYPE "PaymentState" ADD VALUE 'expired'   AFTER  'cancelled';

ALTER TYPE "PaymentMethod" ADD VALUE 'gateway';

-- A payment nobody has made has no moment at which money moved. Every existing
-- row keeps its date: each one is a payment that happened.
ALTER TABLE "Payment" ALTER COLUMN "paidAt" DROP NOT NULL;

-- The gateway's own record. All null for a payment an owner recorded by hand.
ALTER TABLE "Payment" ADD COLUMN "gatewayOrderCode" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "gatewayPaymentId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewayPayload"   JSONB;

-- Unique so a confirmation resolves to exactly one attempt.
CREATE UNIQUE INDEX "Payment_gatewayOrderCode_key" ON "Payment"("gatewayOrderCode");
