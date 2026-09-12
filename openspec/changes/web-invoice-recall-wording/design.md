## Context

A voided invoice is named in 19 frontend strings. 18 say "rút"; the tenancy's invoice panel says "Đã huỷ". The specs describe the state in English ("withdrawn") and name no Vietnamese label, so the requirement added here is about consistency, not about a particular word.

## Goals / Non-Goals

**Goals.** One word — "thu hồi", the owner's choice — everywhere the state appears. No English left in the sentences touched.

**Non-Goals.** No behaviour, API, code or colour change. "Đã huỷ" for a cancelled tenancy stays. "rút gọn" in `SCREENS.md` means "shorten" and is not this word.

## Decisions

**The replacement table.** Grammar is adjusted where "thu hồi" needs it; meaning is unchanged.

| File | Was | Becomes |
|---|---|---|
| `invoices/InvoicesPage.tsx` filter | Kể cả đã rút | Kể cả đã thu hồi |
| `invoices/InvoiceList.tsx` chip | Đã rút | Đã thu hồi |
| `invoices/VoidInvoiceDialog.tsx` title | Rút hoá đơn này | Thu hồi hoá đơn này |
| same, body | {tiền}` for {tháng}` sẽ không còn được tính vào khoản phải thu. | {tiền}` của {tháng}` sẽ không còn được tính vào khoản phải thu. |
| same, notice | …đánh dấu là đã rút. | …đánh dấu là đã thu hồi. |
| same, field | Vì sao rút hoá đơn này? | Vì sao thu hồi hoá đơn này? |
| same, button | Đang rút… / Rút hoá đơn | Đang thu hồi… / Thu hồi hoá đơn |
| `invoices/InvoiceDetailPage.tsx` chip | Đã rút | Đã thu hồi |
| same, notice title | Hoá đơn này đã bị rút | Hoá đơn này đã bị thu hồi |
| same, no reason | …hoá đơn này bị rút từ trước khi hệ thống lưu lý do. | …hoá đơn này bị thu hồi từ trước khi hệ thống lưu lý do. |
| same, date | Rút ngày {ngày}. | Thu hồi ngày {ngày}. |
| same, action | Rút hoá đơn | Thu hồi hoá đơn |
| same, paid-bill notice | Muốn rút hoá đơn này thì phải đảo giao dịch trước · …không rút được… rồi mới rút được. | Muốn thu hồi hoá đơn này thì phải đảo giao dịch trước · …không thu hồi được… rồi mới thu hồi được. |
| `leases/LeaseInvoicesPanel.tsx` chip | Đã huỷ | Đã thu hồi |
| `leases/CancelLeaseDialog.tsx` | Hoá đơn đó sẽ được rút, để thôi bị counted as owed. | Hoá đơn đó sẽ được thu hồi, để không còn bị tính là tiền nợ. |
| `lib/error-messages.ts` `INVOICE_ALREADY_VOIDED` | Hoá đơn này đã được rút. | Hoá đơn này đã được thu hồi. |
| `INVOICE_VOID_PAYLOAD_INVALID` | Thông tin rút hoá đơn chưa hợp lệ. | Thông tin thu hồi hoá đơn chưa hợp lệ. |
| `INVOICE_VOID_AFTER_PAYMENT` | …nên không rút được… | …nên không thu hồi được… |
| `PAYMENT_ON_VOIDED_INVOICE` | …cho hoá đơn đã rút. | …cho hoá đơn đã thu hồi. |

**English comments stay English.** Code comments say "withdrawn" and "voided"; they are read by developers, and the specs use the same words. Only strings a reader sees change.

**A scan is the completion check, not the table.** After editing, the rendered frontend strings are searched for "rút" and for "Đã huỷ" attached to an invoice. The table was built from a grep; a string built by concatenation could hide from it, which is why rendered screens are also read back in the browser.

## Risks / Trade-offs

**"Thu hồi" is longer than "rút".** The chips and the action button grow by a few characters. Measured at 390px rather than assumed.

**Local documents drift.** `TEST-THU-CONG.md` step 5.6 tells the tester to skip "Đã huỷ" rows; it is updated with the chip, uncommitted, so the manual script and the screen agree.
