-- One move-in, one final and one overdue invoice per lease.
--
-- These are the guards the monthly rule could not provide. "One per lease" and
-- "one per tenancy" are not month-shaped, which is why the monthly index was
-- narrowed rather than having the kind folded into its key: a key on
-- (lease, year, month, type) would have permitted one move-in invoice per
-- MONTH, when the rule is one per lease.
--
-- Voided rows are excluded, on the same reasoning as the monthly guard: a
-- voided invoice is retained as history, and reissuing must remain possible.

CREATE UNIQUE INDEX "Invoice_leaseId_moveIn_active_key"
  ON "Invoice"("leaseId") WHERE "voidedAt" IS NULL AND "type" = 'moveIn';

CREATE UNIQUE INDEX "Invoice_leaseId_final_active_key"
  ON "Invoice"("leaseId") WHERE "voidedAt" IS NULL AND "type" = 'final';

CREATE UNIQUE INDEX "Invoice_leaseId_overdue_active_key"
  ON "Invoice"("leaseId") WHERE "voidedAt" IS NULL AND "type" = 'overdue';
