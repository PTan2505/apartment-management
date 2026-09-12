## 1. The dialog

- [x] 1.1 A one-field zod schema for the billed count: required whole number, at least 1, with the existing Vietnamese messages
- [x] 1.2 A dialog holding that field only, titled "Sửa số người tính tiền", reusing the label "Tính cho" and the existing helper sentence
- [x] 1.3 Saves through `useUpdateLease` with a body of `{ occupantCount }` and nothing else — proven by capturing the real PATCH in the page: `{"occupantCount":2}`. Comparing the API before and after would NOT prove it, since sending the old terms back unchanged leaves the API identical; the first draft of the check did exactly that and was replaced. `useUpdateLease` and `updateLease` now take `Partial<…>`, matching the endpoint's `.partial()`
- [ ] 1.4 A server refusal is shown inside the dialog; the dialog stays open with the typed value — WRITTEN, NOT EXERCISED. The 0 in 4.5 was refused by the form before any request was made, so the server-error branch was never reached. Provoking it needs the API to refuse a valid number, e.g. the tenancy ending while the dialog is open

## 2. The button

- [x] 2.1 An icon button on the same line as the "Tính tiền cho" figure, with an accessible name and tooltip
- [x] 2.2 Offered only while the tenancy is running
- [x] 2.3 No other existing string on the card changes

## 2b. Say water, not electricity — on the owner's instruction

- [x] 2b.1 The card caption: "tính tiền điện nước" → "tính tiền nước"
- [x] 2b.2 The helper under "Tính cho" in the signing form: "dùng tính điện nước" → "dùng tính tiền nước"
- [x] 2b.3 The same helper in "Chỉnh sửa hợp đồng", and the new dialog reuses the corrected sentence
- [x] 2b.4 The vacancy message in `error-messages.ts` stays — it is about a different thing

## 3. Checks

- [x] 3.1 `tsc --noEmit`, lint and a production build pass

## 4. Verify in a visible browser, signed out at the start

- [x] 4.1 Desktop, maximised: open a running tenancy, change the count, save, read the new figure back off the card
- [x] 4.2 Reload and read it again, so the figure came from the API and not from form state
- [x] 4.3 The occupant list is unchanged by the save — same people, same count of people
- [x] 4.4 An invoice issued before the change still shows the count it was issued with — with the lease at 2, invoice 9/2026 read "Tiền nước, 1 người · 1 × 100.000 ₫" on screen and quantity 1 in the API
- [x] 4.5 0 is refused, the message names the field, and the API value is unchanged
- [x] 4.6 A tenancy that has ended shows no button; a cancelled one shows none either
- [x] 4.7 "Chỉnh sửa hợp đồng" still edits the count, and both paths read the same value afterwards
- [x] 4.8 390px, scrolled: the button sits beside the figure without wrapping away from it, and nothing overflows at scroll positions that actually differ — 5 positions (0/347/694/1041/1388 of 1732), scrollWidth 390; button 4px from the figure on the same line; dialog x 32..358. Touch emulation was OFF: this proves the layout at that width, not operation by finger

## 5. Notes from verification

- [x] 5.1 B2-01 was changed to 2 and put back to 1 through the new dialog itself, so the seed data used by the manual test script is unchanged
- [x] 5.2 B2-01 lists Nguyễn Văn Hùng as a current occupant (joined 06/09/2026) while he also signs other running tenancies — double occupancy recorded before `api-one-room-per-person` existed. Not repaired here, and not this change's to repair
