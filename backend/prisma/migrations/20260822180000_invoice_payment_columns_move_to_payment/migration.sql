-- Superseded by the Payment table.
--
-- Both asked "which one?" the moment an invoice could carry more than one
-- payment: an invoice paid, reversed and paid again has two methods and two
-- dates, and a column keeps only the last. `paymentStatus` stays behind because
-- it does not have that problem — an invoice is paid or it is not, however many
-- payments it took — and because it is filtered on and grouped over every
-- invoice in a reported range.
--
-- The backfill read these into Payment rows before this ran, and its result was
-- checked against the invoices it was built from: 8 paid invoices, 8 payments,
-- 31,875,000 on both sides. It is deliberately not kept afterwards — it reads
-- columns that no longer exist, so it can neither compile nor run again.
--
-- Separated from the migration that created Payment so that the rollback up to
-- that point is just dropping a table.
ALTER TABLE "Invoice" DROP COLUMN "paymentMethod";
ALTER TABLE "Invoice" DROP COLUMN "paidAt";
