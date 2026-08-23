-- Makes room for move-in, final and overdue invoices, and for a bill that
-- carries two periods at once.
--
-- Nothing here rewrites an existing row. Every invoice already recorded is a
-- monthly one carrying everything it always did; relaxing NOT NULL cannot
-- change what is already stored.

-- A move-in invoice has no utilities: no month, no occupied period, no meter
-- readings. These stop being required and become kind-dependent, enforced in
-- the service since nullability alone cannot express "required for monthly".
ALTER TABLE "Invoice" ALTER COLUMN "year" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "month" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "periodStart" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "periodEnd" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "previousElectricityUse" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "currentElectricityUse" DROP NOT NULL;

-- Each line says which span it covers, because a monthly bill now carries one
-- month's utilities beside the following month's rent.
ALTER TABLE "InvoiceLineItem" ADD COLUMN "periodStart" TIMESTAMP(3);
ALTER TABLE "InvoiceLineItem" ADD COLUMN "periodEnd"   TIMESTAMP(3);

ALTER TYPE "InvoiceLineKind" ADD VALUE 'deposit';
