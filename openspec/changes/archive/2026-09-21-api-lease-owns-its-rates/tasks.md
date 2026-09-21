## 1. Schema

- [x] 1.1 `Lease` gains `electricityRate Decimal(10, 2)` and `waterRatePerPerson Decimal(12, 2)`, commented as copies at the same precision as the building's
- [x] 1.2 Migration `20260918100000_lease_owns_its_rates` adds both columns nullable, backfills every tenancy from its building, then makes them NOT NULL; the comment says this is today's figure and not recovered history

## 2. Backend

- [x] 2.1 `createLease` copies both rates from the room's building inside its existing transaction; a RENEWAL takes today's figures, the rule its rent already follows
- [x] 2.2 `invoices/issue.ts` bills electricity and water from the tenancy — move-in, final and overdue invoices alike
- [x] 2.3 `invoices/service.ts` — the monthly generate, the preview, and the billing-run list, which now shows the rate the tenancy will actually be billed at
- [x] 2.4 The only readers of `building.electricityRate` left are vacancy electricity (the expenses module and the lease-start vacancy cost); no path that bills a tenancy reads the building
- [x] 2.5 `toLeaseResponse` reports both rates, so a screen can show what a tenancy is billed at without reading its building

## 3. Frontend

- [x] 3.1 `Lease` type carries both rates
- [x] 3.2 Building form: an info line under the rate fields, rendered only when editing
- [x] 3.3 New string for review: "Giá mới chỉ áp dụng cho hợp đồng ký từ nay về sau, và hoá đơn của những hợp đồng đó. Hợp đồng đã ký vẫn giữ giá đã thoả thuận."

## 4. Checks

- [x] 4.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`, `atomic:check`
- [x] 4.2 `prisma migrate deploy` applied cleanly; `migrate status` reports the schema up to date

## 5. Verify against the running API

- [x] 5.1 A tenancy created now records 3.000 đ/kWh and 100.000 đ/person from its building
- [x] 5.2 Building raised to 5.000 / 200.000: the tenancy still reads 3.000 / 100.000, and its August invoice charges 100 kWh × 3.000 = 300.000 with 3.000 recorded on the line item
- [x] 5.3 A tenancy signed after the raise records 5.000 / 200.000 and is billed 500.000 for the same 100 kWh — two tenancies, one building, two different bills
- [x] 5.4 Water likewise: 2 × 100.000 = 200.000 for the old tenancy, 2 × 200.000 = 400.000 for the new one
- [x] 5.5 Vacancy electricity for an empty room used the building's CURRENT rate (10 kWh × 5.000 = 50.000, not the 3.000 in force when the room was created)
- [x] 5.6 Tenancies that existed before the change read a backfilled rate and bill exactly as before — #208 reads 4.000 / 100.000, its building's current figures, which is what its next invoice would have used anyway

## 6. Verify in a visible browser

- [x] 6.1 Editing a building shows the line; creating one does not — read back from the dialog's own text
- [x] 6.2 Raised the rate ON SCREEN (3.000 → 5.000, 100.000 → 200.000) and saved; the billing-run row still showed × 3.000 ₫/kWh; issued that tenancy's August invoice from the screen and it charged 300.000 electricity and 200.000 water
- [x] 6.3 390px: the line is present and the dialog does not scroll sideways

## 7. Found during verification

- [x] 7.1 The first browser run reported the rate edit as failing and then "verified" the billing at 3.000 — a vacuous pass, since the building was still at 3.000. The cause was the Chrome window no longer accepting synthesized input at all (not one event reached the page). Relaunched it, rebuilt the data, and re-ran so the raise actually happened before the bill was issued

## 8. Correcting a tenancy's rates, and filling the signing form

- [x] 8.1 `updateLeaseSchema` accepts both rates, commented with why they are editable and what a change does and does not move
- [x] 8.2 Terms dialog: both rates as money fields, filled from the tenancy, with hints saying the change is this tenancy's alone and issued invoices keep their own rates
- [x] 8.3 Signing form: choosing a room fills the agreed rent from that room, beside the opening reading it already filled; the "leave blank" note is replaced by one saying the figure is prefilled and editable
- [x] 8.4 Browser: changed a tenancy from 3.000/100.000 to 4.000/150.000 on screen — the tenancy took the new figures, the building stayed at 5.000/200.000, the August invoice kept 3.000, the billing-run row showed × 4.000, and the September invoice issued from the screen charged 150 kWh × 4.000 = 600.000 and 2 × 150.000 = 300.000
- [x] 8.5 Browser: on the signing form both fields are empty until a room is chosen, then show that room's rent and reading (3.000.000 / 100), and choosing another room fills 4.250.000 from it — each matched against the API

## 9. New strings for review

- [x] 9.1 Building form: "Giá mới chỉ áp dụng cho hợp đồng ký từ nay về sau, và hoá đơn của những hợp đồng đó. Hợp đồng đã ký vẫn giữ giá đã thoả thuận."
- [x] 9.2 Terms dialog: "Giá của riêng hợp đồng này. Hoá đơn đã xuất giữ giá lúc xuất." and "Đổi giá ở đây không đụng tới toà nhà hay hợp đồng khác."
- [x] 9.3 Signing form: "Điền sẵn theo giá thuê của phòng. Sửa được nếu thoả thuận khác." replacing "Để trống: lấy giá thuê hiện tại của phòng"

## 10. Rates on the signing form

- [x] 10.1 `createLeaseSchema` accepts both rates, optional, defaulting in the service to the building's — the pattern `baseRent` already follows
- [x] 10.2 Signing form carries both fields, filled from the chosen room's BUILDING (a room reports only which building it is in, so the figures come from the buildings already loaded for the picker rather than a second request)
- [x] 10.3 Browser: both fields empty before a room is chosen, then 4.500 and 100.000 from the building; edited the electricity rate to 5.734 and signed — tenancy #258 recorded 5.734 while its building stayed at 4.500, and the water rate saved as the building's 100.000
