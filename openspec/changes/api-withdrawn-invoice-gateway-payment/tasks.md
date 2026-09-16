## 1. Reproduce first

- [x] 1.1 On fresh test data (not #390): an unpaid invoice with a pending gateway payment inserted directly, with a unique fake `gatewayOrderCode`, so nothing reaches PayOS — room GW42891, lease #240, move-in invoice #437 (4.900.000 ₫, deposit 3.000.000 ₫), payment #67, order 900042891
- [x] 1.2 Withdraw it through the API, then POST a webhook signed locally with the configured checksum key (never printed) for that order code and amount
- [x] 1.3 Record what the current code does: the invoice becomes paid, and any deposit it charged moves into the holding — reproduced on the unchanged backend: after the confirmation the WITHDRAWN invoice read `paid`, the payment `succeeded`, and the tenancy's deposit holding went 0 → 3.000.000 ₫; a second delivery changed nothing further
- [x] 1.4 On a withdrawn move-in invoice carrying that succeeded payment, reverse it and record the failure: refused, or the holding altered — NOT reproducible on the old code, and recorded as such rather than claimed: there the buggy `settle` had held the deposit, so releasing it on reversal balanced (holding back to 0, HTTP 200). The reversal defect only exists once money lands WITHOUT a hold, i.e. after 2.1; the fix in 2.6 was written for that case and verified in 5.6

## 2. Backend

- [x] 2.1 `settle`: read `voidedAt` inside the transaction; withdrawn → payment succeeded with `paidAt` and payload only
- [x] 2.2 `applyWebhook`: for a withdrawn invoice, accept `pending`, `cancelled` or `expired` after the signature and amount checks; `succeeded` still changes nothing
- [x] 2.3 `voidInvoice`: one transaction — withdraw, and mark pending gateway payments cancelled
- [x] 2.4 `payos.ts`: `cancelPaymentLink(config, orderCode, reason)` calling `POST {BASE_URL}/{orderCode}/cancel`; errors carry no credentials
- [ ] 2.5 After the withdrawal commits, retire each link at the gateway; refused → fetch → `PAID` → `settle`; anything else logged, withdrawal stands — WRITTEN, NOT EXERCISED against PayOS: every withdrawal in verification went to an API instance with the gateway unconfigured (proven by a probe returning GATEWAY_NOT_CONFIGURED before any withdrawal), so the cancel call and its PAID fallback were never reached. Exercising them is 7.1
- [x] 2.6 `reversePayment`: withdrawn invoice → payment reversed only; no deposit release or restore, no status change
- [x] 2.7 The invariant written beside `settle` and `reversePayment`
- [x] 2.8 Invoice responses carry `receivedAfterWithdrawal`, computed in one mapper used by every return

## 3. Frontend

- [x] 3.1 `Invoice` type gains `receivedAfterWithdrawal`
- [x] 3.2 Invoice screen: an error alert of its own directly below the withdrawn notice — planned as a line inside that notice, changed because the notice is history and this is a task; design.md updated to match
- [x] 3.3 Invoice list and tenancy panel: chip "Có tiền cần trả lại"
- [x] 3.4 New strings reported to the owner: the notice sentence and the chip label — chip "Có tiền cần trả lại"; alert title "Có tiền chuyển về sau khi hoá đơn đã bị thu hồi"; body "{tiền} đã về cho hoá đơn này sau khi thu hồi. Khoản này phải trả lại cho khách: đảo giao dịch ở mục Thanh toán bên dưới.". Owner then asked for a clearer word than "Đảo": chose "Hoàn tiền cho khách", so the alert body now ends "…phải trả lại cho khách: hoàn tiền ở mục Thanh toán bên dưới."

## 4. Checks

- [x] 4.1 `tsc --noEmit` backend and frontend, lint, both builds, `codes:check`, `atomic:check`

## 5. Verify against the running API, no call reaching PayOS

- [x] 5.1 Repeat 1.2 after the fix: payment succeeded with `paidAt`; invoice still withdrawn and pending; deposit holding unchanged — case A (#438, payment retired to `cancelled` at withdrawal) and case B (#439, payment left `pending`): both recorded as succeeded, invoice stayed withdrawn and pending, holding stayed 0
- [x] 5.2 The same webhook again: nothing changes
- [x] 5.3 A retired (`cancelled`) payment on a withdrawn invoice receives a confirmation: recorded, not ignored
- [x] 5.4 A confirmation for a payment on an invoice that was NOT withdrawn: settled as before, deposit held
- [x] 5.5 Withdraw an invoice with a pending gateway payment on an API instance without gateway configuration: withdrawn, payment cancelled, request answered
- [x] 5.6 Reverse the landed payment on a withdrawn move-in invoice: reversed, holding unchanged, invoice unchanged — first measured on a lease holding 0, which proved nothing (0 → 0). Redone on lease #245, whose 3.000.000 ₫ deposit had been collected in CASH: money landed on the withdrawn invoice #444, the reversal succeeded, and the holding stayed 3.000.000 ₫. Control on the ordinary path (invoice #445, not withdrawn): paying it moved the holding 0 → 3.000.000 and reversing moved it back to 0, so the release this branch skips is a real 3.000.000 ₫ movement, not a no-op
- [x] 5.7 Revenue report: the month's cash figure is identical before the money lands, after it lands and after it is reversed — building 45, September: 0 before, 0 after landing, 0 after reversal. Not a vacuous 0 = 0: the landed payment is dated 12/09/2026, so counting it would have made the figure 4.900.000
- [x] 5.8 `receivedAfterWithdrawal`: the amount while unreturned, null after reversal, null on an ordinary withdrawn invoice

## 6. Verify in a visible browser, signed out at the start

- [x] 6.1 The withdrawn invoice with landed money: notice shows the amount and the instruction; read back — signed-out start; on #439 and again on #441 the error alert (class `MuiAlert-colorError`) reads 4.900.000 ₫ and the instruction, below the unchanged withdrawn notice, with exactly one "Đảo giao dịch" button
- [x] 6.2 Invoice list with withdrawn included, and the tenancy panel: the chip is there — visible chips on the list equal the invoices the API flags (1 vs 1); the desktop table keeps its three chips on one line; control #392 (withdrawn, nothing landed) shows only "Đã thu hồi"
- [x] 6.3 Reverse the payment on the screen: the chip and the notice block are gone — clicked on #439: payment reversed, `receivedAfterWithdrawal` null, invoice still withdrawn and pending, deposit holding unchanged, alert, list chip and panel chip gone (10/10). The deposit figure in that on-screen run was 0 before and after, so it carried no weight; the holding evidence is 5.6
- [x] 6.4 390px: notice and chips fit, measured at scroll positions that actually differ — failed first, see 8.3; after the fix, on #441: card 356/356, no text past its edges, alert 16–374, invoice page at 3 distinct scroll positions and tenancy page at 5, no page overflow

## 7. Only with the owner's go-ahead

- [ ] 7.1 Exercise the real PayOS cancel endpoint on a link created for the purpose
- [ ] 7.2 Decide whether to cancel #63 on #390 at PayOS

## 8. Found during implementation

- [x] 8.1 The first run of the verification refused to start: its probe for "is the gateway off on 5051" used the portal payment endpoint, which validates the payload before looking at the gateway and so answered PAYMENT_PAYLOAD_INVALID either way. Replaced by an empty webhook, which checks configuration first. Nothing had been withdrawn and no data created when it stopped
- [x] 8.2 The verification scripts lived in `backend/` only to reach its `node_modules`, and were moved out to the scratchpad after running; `git log --all` confirms neither was ever committed
- [x] 8.3 The new chip broke the phone invoice card: three chips held on one line (`flexWrap: nowrap`, written for the table) made the card 420px wide in a 356px column, so it scrolled sideways and cut off its own period, lease and amount. The 390px check had passed anyway, because it accepted a chip inside "a horizontally scrolling container" — and that container was the overflowing card. Fixed in `InvoiceList.tsx` for the card only (`StatusChips wrap`, header allowed to wrap; the table stays nowrap), and the check now measures the card itself. Counter-checked in the live page: restoring `nowrap` on the same card brings the overflow back (412/356)
- [x] 8.4 At the owner's request, "Đảo giao dịch" was replaced everywhere by wording they picked: button "Hoàn tiền cho khách", state chip "Đã hoàn tiền", caption "Nhận …, hoàn …", the notice "Muốn thu hồi hoá đơn này thì phải hoàn tiền trước", and four error messages in `error-messages.ts` (INVOICE_VOID_AFTER_PAYMENT, PAYMENT_ALREADY_REVERSED, PAYMENT_REVERSAL_PAYLOAD_INVALID, DEPOSIT_VOID_ALREADY_SPENT). Read back on screen: no "đảo" left anywhere on an invoice page, the longer button still fits at 390px, desktop 13/13, 390px 16/16, clicking it 10/10 on invoice #446
