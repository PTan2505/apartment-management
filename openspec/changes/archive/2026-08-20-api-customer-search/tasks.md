# Tasks

## 1. Normalisation helper

- [x] 1.1 Add `normalizeVi` to `backend/src/lib/` — NFD decompose, strip combining marks, map `đ`/`Đ` to `d`, lowercase. The `đ` mapping is explicit and not optional: NFD does not decompose `đ`, so without it `Đức` normalises to `đuc` and a search for `duc` misses.
- [x] 1.2 Note in the helper why it exists and that it is for matching only — it must never be shown to a user or written back over the name it was derived from.

## 2. Schema and migration

- [x] 2.1 Add `fullNameSearch String` to `User` in `schema.prisma`, with a comment saying it is a derived search key rather than data anyone enters.
- [x] 2.2 Generate the migration, then edit it to backfill existing rows rather than leaving them empty — an existing customer must not become unfindable.
- [x] 2.3 Decide the backfill's shape: SQL can do lowercase and `đ → d`, but not full diacritic stripping, so the backfill runs through the helper in a script step rather than being pure SQL. Confirmed: pure SQL using `lower(unaccent(...))`, verified to agree with the helper on a 13-sample Vietnamese corpus. `lower()` must come after `unaccent()`, not before.
- [x] 2.4 Apply the migration and confirm every existing row has a non-empty `fullNameSearch`.

## 3. Keep the column in step with the name

- [x] 3.1 Set `fullNameSearch` on customer creation in `modules/customers/service.ts` (`prisma.user.create`).
- [x] 3.2 Set it on customer update in `modules/customers/service.ts`. This path spreads `data: input` directly and `fullName` is optional there, so the field must be set only when the name is actually being changed — spreading a normalised value derived from `undefined` would blank the column.
- [x] 3.3 Set it in `scripts/seed-owner.ts`, in both the `create` and `update` branches of the upsert.
- [x] 3.4 Confirm no other write path to `User.fullName` exists, so the column cannot drift.

## 4. Search

- [x] 4.1 Search `fullNameSearch` with the normalised query in `modules/customers/service.ts`, replacing the `fullName` + `mode: "insensitive"` filter.
- [x] 4.2 Leave the `phone` filter exactly as it is — exact, un-normalised.
- [x] 4.3 Confirm `fullNameSearch` is absent from `customerSelect`, so it is never returned.
- [x] 4.4 Run `tsc --noEmit`.

## 5. Verification against the running API

Failure paths included, not just the happy path.

- [x] 5.1 Create customers covering the cases: a plain name, a name with diacritics, and a name containing `Đ`.
- [x] 5.2 Searching `nguyen van a` finds `Nguyễn Văn A` — the case this change exists for.
- [x] 5.3 Searching `NGUYEN` and `Nguyễn` both find the same customer.
- [x] 5.4 Searching `duc` finds a customer recorded with `Đức` — the `đ` case that a naive implementation gets wrong.
- [x] 5.5 Searching by phone still matches, and a wrong digit returns an empty list.
- [x] 5.6 Searching text no customer matches returns HTTP 200 and an empty list, not an error.
- [x] 5.7 No response contains `fullNameSearch`.
- [x] 5.8 Renaming a customer makes them findable by the new name and no longer findable by the old one — proving the column follows updates and does not go stale.
- [x] 5.9 A customer created before the migration is still findable, confirming the backfill worked. (No customers existed before the migration, so this was verified by inserting a row keyed with the migration's own `lower(unaccent(...))` expression and searching for it through the API, rather than by a genuinely pre-existing row.)
- [x] 5.10 Paging over a searched result reports totals for the matched set only.
- [x] 5.11 Remove the verification data, leaving the database as it was found.
