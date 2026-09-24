## 1. Schema

- [x] 1.1 `User` gains `idCardFrontKey` and `idCardBackKey`, both nullable, commented as references into storage and as belonging to the PERSON
- [x] 1.2 `20260918120000_customer_id_card` adds both columns nullable — nothing to backfill, so it applies to a populated database untouched

## 2. Storage

- [x] 2.1 `lib/storage.ts`: image-only content types, a 10 MB ceiling, `customers/{id}/id-card/{side}/` prefixes, derived keys, `signIdCardUpload`, and `signDownload` (the contract's download signer, renamed and shared)

## 3. Backend

- [x] 3.1 `POST /customers/:id/id-card-upload-url`
- [x] 3.2 `POST /customers/:id/id-card` — prefix, existence and size all checked; an oversized object is deleted; only that SIDE's prefix is cleared
- [x] 3.3 `GET /customers/:id/id-card/:side` — signed, short-lived; 404 when nothing is on file
- [x] 3.4 `DELETE /customers/:id/id-card/:side`
- [x] 3.5 All four refuse with STORAGE_NOT_CONFIGURED when storage is unconfigured
- [x] 3.6 Customer responses carry `hasIdCardFront` / `hasIdCardBack`; the keys never leave the service

## 4. Frontend

- [x] 4.1 `IdCardPicker` — one per side, with a preview of the chosen file and its object URL revoked when replaced
- [x] 4.2 The tenancy is created first, then the images; a failure keeps the dialog open, says what happened, and offers "Mở hợp đồng"
- [x] 4.3 `IdCardCard` on the tenancy page: per side, what is on file, with view, replace and remove
- [x] 4.4 New strings listed in section 10

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds, `codes:check` (regenerated — seven new codes), `atomic:check`
- [x] 5.2 Migration applied locally; `migrate status` clean

## 6. Verify against the running API

- [x] 6.1 Front uploaded and confirmed against the real bucket: customer reports front true, back false
- [x] 6.2 Replacing the front left the back untouched; asked R2 directly with HeadObject — the previous object is gone, the new one is there
- [x] 6.3 A key under another customer's prefix answers 400 ID_CARD_KEY_FOREIGN
- [x] 6.4 An 11 MB upload answers 400 ID_CARD_FILE_TOO_LARGE and the object is gone from the bucket
- [x] 6.5 A signed download URL is issued and fetches the image; a side not on file answers 404 ID_CARD_NONE_ON_FILE; a key with no object answers 400 ID_CARD_OBJECT_MISSING
- [x] 6.6 Removing the front left the back on file and emptied only the front's prefix

## 7. Verify in a visible browser

- [x] 7.1 Signed a tenancy with both images after the owner added the bucket's CORS rule: tenancy #262 created, its signatory carries both, and the tenancy page shows both with Xem / Thay ảnh / Xoá. "Xem" opened the image in a new tab through a URL carrying X-Amz-Signature and X-Amz-Expires
- [x] 7.2 A tenancy signed with no images: created, signatory unchanged, no error
- [x] 7.3 From the tenancy page: replaced the front — the recorded object changed (…dba6e1c6567a.png → …b1ebaf4f98e7.png), the new one fetches through its signed link, and the card still reads "Đã có ảnh"; removed the back — front stayed, back gone
- [x] 7.4 390px: the card on the tenancy page does not scroll sideways and the page stays within 390

## 8. The hosted database on Neon

- [x] 8.1 Instructions written — see section 11

## 9. Found during verification

- [x] 9.1 RESOLVED by the owner adding the rule. The browser's upload never reached storage: R2 answers the preflight with no CORS rule, so `fetch` fails before a byte moves. Found by watching what the page actually requested, after a first probe hooked `fetch` only and missed the API's axios calls entirely. The bucket needs a rule allowing PUT and GET from the app's origins; it is the owner's Cloudflare resource, so it is written up rather than applied
- [x] 9.2 A failure the first version hid: when the images failed, the code set a message AND navigated to the tenancy, which unmounted the dialog carrying the message — so a failed upload looked exactly like a success. The dialog now stays, says what happened, and offers the way on. Verified on screen with the uploads genuinely failing

## 12. The signed contract, attached while signing

- [x] 12.1 `attachContract` in the leases API — the same three steps the contract card uses, and it never throws, because it runs after the tenancy exists
- [x] 12.2 Signing form: a file picker showing the chosen file's name and size; KB below a megabyte, because a 60 KB scan shown as "0.0 MB" reads as an empty file
- [x] 12.3 A failed contract is named alongside a failed ID card in one message, and the dialog stays with "Mở hợp đồng"
- [x] 12.4 Browser: three file pickers in the form; signed tenancy #264 with a PDF and a front image together — the tenancy reports `hasContract`, the signatory reports the image, and the PDF fetches back through its signed link as application/pdf; the tenancy page reads "Đã có bản scan trên hệ thống"

## 10. New strings for review

- [x] 10.1 Form: "Căn cước công dân của người đứng tên" · "Mặt trước" / "Mặt sau" · "Chọn ảnh" · "Không bắt buộc. Ảnh được lưu cho khách, dùng lại cho các hợp đồng sau."
- [x] 10.2 On failure: "Đã tạo hợp đồng, nhưng chưa tải lên được ảnh {mặt trước và mặt sau} của căn cước. Mở hợp đồng để tải lại ảnh." · button "Mở hợp đồng"
- [x] 10.3 Form: "Bản hợp đồng đã ký" · "Chọn tệp" · "Không bắt buộc. Nhận tệp PDF hoặc ảnh (JPG, PNG, HEIC), tối đa 20 MB." · failure now reads "Đã tạo hợp đồng, nhưng chưa tải lên được: {danh sách}. Mở hợp đồng để tải lại."
- [x] 10.4 Tenancy page: "Căn cước công dân" · "Của {tên}. Ảnh lưu theo khách, dùng chung cho mọi hợp đồng của người này." · "Đã có ảnh" / "Chưa có ảnh" · "Xem" · "Tải ảnh lên" / "Thay ảnh" · "Xoá"
- [x] 10.5 Errors: seven ID_CARD_* messages plus STORAGE_NOT_CONFIGURED, in `error-messages.ts`

## 11. Applying this to the hosted database (Neon)

The migration adds two nullable columns to `"User"`. Nothing is backfilled and nothing is rewritten, so it is safe to run while the application is up: existing rows get NULL, which is what "no card on file" means.

**The one-command way.** With the Neon connection string in `DATABASE_URL`, from `backend/`:

```
DATABASE_URL='<neon connection string>' npx prisma migrate deploy
```

`migrate deploy` applies only migrations that are not yet recorded in `_prisma_migrations`, and never generates new ones — it is the command meant for a database you did not develop against.

Use Neon's DIRECT (unpooled) connection string, not the `-pooler` one: migrations run DDL in a session, and a pooled connection can hand the next statement to a different backend.

**Checking it applied:**

```
DATABASE_URL='<neon connection string>' npx prisma migrate status
```

It should report the schema up to date and list `20260918120000_customer_id_card` among the applied migrations. In the Neon SQL editor, the same answer:

```sql
select column_name from information_schema.columns
where table_name = 'User' and column_name in ('idCardFrontKey', 'idCardBackKey');
```

Two rows means it is there.

**If it fails partway.** The migration is two `ALTER TABLE` statements and nothing else. If the first applied and the second did not, run the missing one by hand in the Neon SQL editor and mark the migration as applied so Prisma does not try again:

```sql
alter table "User" add column if not exists "idCardFrontKey" text;
alter table "User" add column if not exists "idCardBackKey" text;
```

```
DATABASE_URL='<neon connection string>' npx prisma migrate resolve --applied 20260918120000_customer_id_card
```

**Undoing it.** Dropping the columns removes every reference to uploaded images while the images themselves stay in the bucket:

```sql
alter table "User" drop column "idCardFrontKey";
alter table "User" drop column "idCardBackKey";
```

**Also pending on that database.** `20260918100000_lease_owns_its_rates` — from the tenancy-rates change — has not been applied there either. It is not optional for that change to work, and unlike this one it DOES write to existing rows: it backfills every tenancy from its building's current rates. `migrate deploy` applies both in order.

**The deployed API also needs R2 CORS** before any upload works from a browser. See section 9.1; the rule is in the report.
