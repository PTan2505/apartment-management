-- Adds fullNameSearch: a matching key derived from fullName, lowercased with
-- diacritics folded away, so a name typed without diacritics still finds it.
--
-- Written in three steps rather than one because the column is NOT NULL and the
-- table already has rows: adding it outright would have nothing to put in them.
--
-- The backfill uses unaccent() and must call lower() AFTER it, not before. The
-- database uses the C collation, where lower() folds ASCII only — lower('ĐỨC')
-- returns 'ĐỨc' — so lowering first leaves Đ and Ứ untouched and unaccent then
-- renders them as uppercase ASCII, producing 'DUc' instead of 'duc'. Unaccenting
-- first reduces them to plain ASCII, which lower() can then fold correctly.
--
-- This SQL was checked against the application's normalizeVi helper over a
-- Vietnamese corpus and agreed on every sample. That is verified agreement for
-- Vietnamese text, not a proof for arbitrary input — it is acceptable because
-- this runs exactly once, over the rows present at migration time, and every
-- write afterwards goes through the helper, which is the single authority.

CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Add it nullable, so existing rows are allowed to be empty for a moment.
ALTER TABLE "User" ADD COLUMN "fullNameSearch" TEXT;

-- 2. Fill every existing row. Without this an existing customer would be left
--    with no matching key and would silently stop being findable.
UPDATE "User" SET "fullNameSearch" = lower(unaccent("fullName"));

-- 3. Now that no row is empty, require it — the application must never write a
--    name without also writing its key.
ALTER TABLE "User" ALTER COLUMN "fullNameSearch" SET NOT NULL;
