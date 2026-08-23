-- What settles an invoice, recorded as an event in its own right.
--
-- Purely additive. Nothing reads this table yet: the backfill fills it from the
-- columns on Invoice, and only once those figures are checked do the reads move
-- over. Rollback at this point is dropping the table.
CREATE TYPE "PaymentState" AS ENUM ('succeeded', 'reversed');

CREATE TABLE "Payment" (
  "id"         SERIAL          PRIMARY KEY,
  "invoiceId"  INTEGER         NOT NULL,
  "amount"     DECIMAL(14,0)   NOT NULL,
  "method"     "PaymentMethod" NOT NULL,
  "paidAt"     TIMESTAMP(3)    NOT NULL,
  "state"      "PaymentState"  NOT NULL DEFAULT 'succeeded',
  "reversedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3)    NOT NULL,
  CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId")
    REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");
-- The cash figure sums by this across a reported range.
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");
