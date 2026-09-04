-- Why a bill was withdrawn.
--
-- Nullable with no backfill, though the service requires one on the way in.
-- Invoices voided before this change were withdrawn for reasons nobody
-- recorded and nobody now knows; a NOT NULL column would force writing
-- something like "Reason not recorded" into them, stating as fact a sentence
-- nobody said. Null reads as "voided before reasons were recorded".
ALTER TABLE "Invoice" ADD COLUMN "voidReason" TEXT;
