-- A tenant's way into the portal: a link the owner sends once.
--
-- Purely additive; nothing existing reads it. The design is the refresh
-- token's, applied to the same shape of problem — a long-lived credential that
-- has to be withdrawable. The hash is unique because it is looked up by
-- equality on every portal request, and it is a hash because a copy of this
-- database must not be a copy of every tenant's link.
CREATE TABLE "TenantAccessToken" (
  "id"         SERIAL       PRIMARY KEY,
  "userId"     INTEGER      NOT NULL,
  "tokenHash"  TEXT         NOT NULL,
  "revokedAt"  TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TenantAccessToken_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TenantAccessToken_tokenHash_key" ON "TenantAccessToken"("tokenHash");
CREATE INDEX "TenantAccessToken_userId_idx" ON "TenantAccessToken"("userId");
