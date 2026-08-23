-- Keep what the tenant pays with, so returning to a bill hands back the same
-- link instead of creating another. One live link per bill keeps the gateway's
-- own dashboard readable, and stops a tenant holding two QR codes for one debt.
ALTER TABLE "Payment" ADD COLUMN "gatewayCheckoutUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "gatewayQrCode"      TEXT;
