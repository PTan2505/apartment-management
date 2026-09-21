## Why

One invoice state has two names. The invoice screens call a voided bill "Đã rút" — "Rút hoá đơn", "Hoá đơn này đã bị rút" — while the invoice panel on a tenancy calls the same bill "Đã huỷ". The owner met both in one click: "Đã huỷ" on the tenancy, then "Đã rút" on the invoice it opened, and read them as two different things.

Neither word works on its own. "Rút" is not what an owner calls correcting a bill, so the state needed explaining. "Huỷ" is already the name of a different thing on the same tenancy screen — a cancelled tenancy — so using it for a bill joins two unrelated actions under one word.

The owner chose "thu hồi": the bill is taken back, kept on record, and no longer owed.

## What Changes

- Every place a voided invoice is named, labelled, confirmed or explained says "thu hồi": the status chip ("Đã thu hồi") on the invoice list, the invoice screen and the tenancy's invoice panel; the action ("Thu hồi hoá đơn"); the confirmation dialog; the invoice screen's notice; the filter "Kể cả đã thu hồi"; and the four error messages that name the state.
- Two English fragments left in those same sentences become Vietnamese: "for {tháng}" in the confirmation dialog, and "counted as owed" in the cancellation dialog.

## Deliberately not changed

**Behaviour.** What voiding does is unchanged: the bill is kept, excluded from every total, and its month becomes billable again.

**"Đã huỷ" for a cancelled tenancy.** That is the other meaning, and it keeps the word.

**The API.** Codes stay `INVOICE_ALREADY_VOIDED` and so on; only the sentences the frontend shows for them change.

## Capabilities

### Modified Capabilities

- `web-invoices`: a withdrawn invoice carries one name on every screen, and that name is not shared with a cancelled tenancy.

## Impact

- `frontend/src/features/invoices/` — the list, the detail screen, the void dialog and the list filter.
- `frontend/src/features/leases/` — the tenancy's invoice panel, and one sentence in the cancellation dialog.
- `frontend/src/lib/error-messages.ts` — four sentences.
- Local-only `TEST-THU-CONG.md` (two lines) and `SCREENS.md` (one line) name the state and are updated, uncommitted.
