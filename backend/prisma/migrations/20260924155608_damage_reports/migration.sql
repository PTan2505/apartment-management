-- What a tenant says is broken, and what became of it.

CREATE TYPE "DamageReportState" AS ENUM ('new', 'scheduled', 'done');

CREATE TABLE "DamageReport" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "state" "DamageReportState" NOT NULL DEFAULT 'new',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "scheduleNote" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "scheduledById" INTEGER,
    "closedAt" TIMESTAMP(3),
    "closingNote" TEXT,
    "closedById" INTEGER,

    CONSTRAINT "DamageReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DamageReport_state_reportedAt_idx" ON "DamageReport"("state", "reportedAt");
CREATE INDEX "DamageReport_leaseId_reportedAt_idx" ON "DamageReport"("leaseId", "reportedAt");

CREATE TABLE "DamageReportPhoto" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DamageReportPhoto_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DamageReportPhoto_key_key" ON "DamageReportPhoto"("key");
CREATE INDEX "DamageReportPhoto_reportId_uploadedAt_idx" ON "DamageReportPhoto"("reportId", "uploadedAt");

ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_scheduledById_fkey"
    FOREIGN KEY ("scheduledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DamageReport" ADD CONSTRAINT "DamageReport_closedById_fkey"
    FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DamageReportPhoto" ADD CONSTRAINT "DamageReportPhoto_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
