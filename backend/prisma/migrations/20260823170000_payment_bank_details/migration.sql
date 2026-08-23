-- The bank details a payment code is built from.
--
-- The gateway returns these on every payment request and the code discarded
-- all but two of them. Kept now so that returning to a bill can rebuild the
-- same code without asking the gateway to allocate another account.
--
-- The account here is the gateway's virtual one, allocated per attempt — never
-- the owner's own, which would take the money outside the gateway's sight.
ALTER TABLE "Payment" ADD COLUMN "gatewayBin"           TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewayAccountNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewayAccountName"   TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewayDescription"   TEXT;
