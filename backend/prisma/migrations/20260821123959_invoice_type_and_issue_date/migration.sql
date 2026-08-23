-- Gives an invoice a kind and an issue date, ahead of the billing rework that
-- needs four kinds. Every invoice today is a monthly one and every invoice this
-- change produces still is: no amount moves.

CREATE TYPE "InvoiceType" AS ENUM ('moveIn', 'monthly', 'final', 'overdue');

-- Defaulted rather than backfilled in a separate step: monthly is what every
-- existing row is, and what every new one will be until the billing rework.
ALTER TABLE "Invoice" ADD COLUMN "type" "InvoiceType" NOT NULL DEFAULT 'monthly';

-- Added nullable, backfilled from createdAt — which is exactly when each
-- existing invoice was issued, since nothing back-dates one today — then
-- required, so no invoice can exist without saying when it was billed.
ALTER TABLE "Invoice" ADD COLUMN "issueDate" TIMESTAMP(3);
UPDATE "Invoice" SET "issueDate" = "createdAt";
ALTER TABLE "Invoice" ALTER COLUMN "issueDate" SET NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "issueDate" SET DEFAULT CURRENT_TIMESTAMP;

-- Narrow the guard to monthly invoices. A lease and month may legitimately hold
-- a move-in or a final invoice alongside its monthly one, and neither is a
-- duplicate of the other. Dropping and recreating inside this transaction, so
-- nothing can insert while the table is unguarded.
DROP INDEX "Invoice_leaseId_year_month_active_key";
CREATE UNIQUE INDEX "Invoice_leaseId_year_month_monthly_active_key"
  ON "Invoice"("leaseId", "year", "month")
  WHERE "voidedAt" IS NULL AND "type" = 'monthly';
