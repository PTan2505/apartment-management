## Why

The lease detail screen holds the terms an owner agreed to and the file they signed, and it presents them as three stacked cards with no order of importance. The figure a tenant argues about — the rent — sits at the same weight as the count of occupants. Nothing on the screen answers the two questions an owner opens it to ask: how long is left, and has this tenancy paid.

The new design answers both. It gives the tenancy a header that states its identity, status and remaining time in one band; it ranks the terms so money reads first; and it puts the tenancy's billing history beside them, which is where an owner's next question already points. Today reaching that history means leaving for the invoice list and filtering it back down to this one tenancy.

## What Changes

- The header becomes a summary band: room and tenant as the title, tenancy status, the phone number, when the record was opened, and how much of the term remains. The existing actions keep their behaviour and move into it.
- The terms card is reordered so rent and deposit lead, and its labels are made explicit — `Giá thuê` → `Tiền thuê hàng tháng`, `Tiền cọc` → `Tiền cọc đảm bảo`, `Bắt đầu` → `Ngày bắt đầu hiệu lực`, `Thoả thuận đến hết` → `Ngày kết thúc thoả thuận`. Confirmed with the owner rather than assumed.
- The contract card keeps `hasContract` as its only source of truth. It gets the design's filled and empty treatments, and states the size limit uploads are actually held to.
- **New**: a panel listing this tenancy's invoices by period, with the amount, whether it is collected, the total number issued and the balance outstanding. It reads the existing invoice list filtered by lease — no new endpoint, no new hook.
- Nothing about what the screen DOES changes: the same dialogs, the same mutations, the same refusals.

### Deliberately not built, because the API does not report it

The design shows ten things the backend does not hold. Rather than invent them in the browser, they are named here and left out:

`Mã hợp đồng` · `Thời hạn báo trước khi chuyển đi` · `Chu kỳ thanh toán` · the opening WATER reading · `Đã ký biên bản bàn giao` · `Đã đối soát chữ ký` · the contract file's name, size and upload time · an invoice's `Hạn đóng` · `Đã đối soát ngân hàng` and the receipt number · the `Nhắc phí` action.

Two of these are worth separating from the rest. The opening ELECTRICITY reading is already stored — it is only missing from what the lease endpoint returns, so it is a small API change rather than a new concept. The contract file's name and size are withheld ON PURPOSE: the storage key never reaches the browser, and every link to the file is signed when it is asked for.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-leases`: the detail screen gains a stated reading order, an explicit statement of what it must never fabricate, and a panel reporting the tenancy's billing history.

## Impact

- `frontend/src/features/leases/LeaseDetailPage.tsx`, `ContractCard.tsx`, and the terms card within the page.
- One new presentational component for the invoice panel, under `features/leases/`.
- Reads `useInvoices({ leaseId })`, which already exists. **No change to any `api.ts` or hook.**
- No backend change. No change to any data shape.
