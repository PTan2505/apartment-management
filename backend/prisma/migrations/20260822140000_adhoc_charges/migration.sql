-- Charges the owner decides rather than calculates.
--
-- Purely additive: no existing row changes meaning, and no unique index is
-- added for the new invoice kind. A lease may have as many ad-hoc invoices as
-- it has events, unlike the move-in, final and overdue kinds whose one-per-lease
-- rules each have an index of their own.
ALTER TYPE "InvoiceType" ADD VALUE 'adhoc';
ALTER TYPE "InvoiceLineKind" ADD VALUE 'charge';

CREATE TYPE "ChargeCategory" AS ENUM ('damage', 'cleaning', 'lost_item', 'penalty', 'other');

-- On the line rather than the invoice: one bill may carry a damage charge and a
-- cleaning charge. Null for every other line kind.
ALTER TABLE "InvoiceLineItem" ADD COLUMN "chargeCategory" "ChargeCategory";
