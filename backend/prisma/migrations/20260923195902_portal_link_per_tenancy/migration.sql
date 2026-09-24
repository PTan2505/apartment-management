-- The portal link moves from a person to a tenancy.
--
-- The old table is dropped rather than migrated: a token issued to a person has
-- no single tenancy to belong to, and the ones that exist are development data.
-- Every tenancy is issued a fresh link by `npm run portal:backfill` immediately
-- after this runs, so no tenancy is left without one.
DROP TABLE "TenantAccessToken";

CREATE TABLE "LeasePortalToken" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tokenCipher" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeasePortalToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeasePortalToken_tokenHash_key" ON "LeasePortalToken"("tokenHash");
CREATE INDEX "LeasePortalToken_leaseId_idx" ON "LeasePortalToken"("leaseId");

ALTER TABLE "LeasePortalToken" ADD CONSTRAINT "LeasePortalToken_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
