-- An expense may be the cost of a damage report.
--
-- The reference points from the money to the repair, and the report keeps no
-- amount of its own: two records of one number is two records that can
-- disagree. UNIQUE is what makes a repair costable only once — a second
-- recording updates this row rather than inserting beside it.
--
-- Nullable, so every expense recorded before this keeps meaning what it meant.
-- ON DELETE SET NULL rather than CASCADE: deleting a report must not silently
-- remove money from the owner's books.

ALTER TABLE "Expense" ADD COLUMN "damageReportId" INTEGER;

CREATE UNIQUE INDEX "Expense_damageReportId_key" ON "Expense"("damageReportId");

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_damageReportId_fkey"
  FOREIGN KEY ("damageReportId") REFERENCES "DamageReport"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
