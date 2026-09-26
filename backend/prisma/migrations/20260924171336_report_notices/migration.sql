-- One notice per person per report: what happened while they were away.

CREATE TABLE "ReportNotice" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "reportId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "ReportNotice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReportNotice_userId_reportId_key" ON "ReportNotice"("userId", "reportId");
CREATE INDEX "ReportNotice_userId_readAt_idx" ON "ReportNotice"("userId", "readAt");

ALTER TABLE "ReportNotice" ADD CONSTRAINT "ReportNotice_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReportNotice" ADD CONSTRAINT "ReportNotice_reportId_fkey"
    FOREIGN KEY ("reportId") REFERENCES "DamageReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
