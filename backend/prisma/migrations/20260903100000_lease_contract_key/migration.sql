-- Where the signed contract for a tenancy is kept, as a storage key.
--
-- The key rather than a URL: the file is not public and every link to it is
-- signed at the moment it is asked for, so a stored URL would be one that has
-- already expired.
--
-- Nullable with no backfill. Tenancies predating this have no contract, and an
-- empty column says exactly that.
ALTER TABLE "Lease" ADD COLUMN "contractKey" TEXT;
