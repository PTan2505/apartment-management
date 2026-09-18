-- The two sides of a customer's ID card, as references into object storage.
--
-- Nullable, so this applies to a populated database with no backfill: nobody
-- has a card on file until one is uploaded.
ALTER TABLE "User" ADD COLUMN "idCardFrontKey" TEXT;
ALTER TABLE "User" ADD COLUMN "idCardBackKey" TEXT;
