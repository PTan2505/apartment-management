## 1. Carry the fields through

- [x] 1.1 `buildingName: string` on `PortalInvoice` — the mapper reads it through a required relation
- [x] 1.2 `settledAt: string | null` — null for unpaid, and ALSO for settled with no dated payment

## 2. Show them

- [x] 2.1 The building beside the room: `Phòng {roomCode} · {buildingName} · {issueDate}`
- [x] 2.2 A settled date beside the "Đã trả" chip
- [x] 2.3 Nothing extra where a settled bill has no date — the chip stands alone
- [x] 2.4 No settled date on an unpaid bill
- [x] 2.5 Every string Vietnamese

## 3. Verify in a real browser, on a real portal link

- [x] 3.1 Mobile 390px first — this screen is opened on a phone
- [x] 3.2 The building name appears and matches what the API reports
- [x] 3.3 A settled bill shows its date; read the value back, do not eyeball it
- [x] 3.4 An unpaid bill shows no settled date
- [x] 3.5 A settled bill with `settledAt` null reads as settled with no date — created by clearing `paidAt` on invoice 385's succeeded payment, leaving `paymentStatus` paid. The card reads "Đã trả" with nothing after it while its neighbours read "Đã trả · Trả ngày 6/9/2026"
- [x] 3.6 Horizontal overflow measured at scroll positions that actually differ — 4 positions each pass, `scrollWidth` 390 and 1800. The first desktop run measured ONE position and reported it as a pass: the step was a fixed 700px against a 463px scroll range, so the loop ran once. The step is now sized from the real range
- [x] 3.7 Desktop pass, maximised
- [x] 3.8 `tsc --noEmit`, lint and a production build pass

## 4. One defect the screenshot found

- [x] 4.1 A settled card now carried TWO unlabelled dates — the issue date already ended the row below, and the new one sat bare beside the chip, leaving the tenant to guess which was the day their money arrived. That is the one of the two they opened the portal to check. Labelled "Trả ngày", which also does not repeat what the chip already says

## 5. Noted, not changed — outside this change

- [x] 5.1 The portal formats dates with `toLocaleDateString('vi-VN')` and no time zone, so it renders `6/9/2026` where the owner app renders `06/09/2026` and pins UTC. Pre-existing: `issueDate` has always gone through that function, and the new field simply uses the same one. Worth a change of its own, because a UTC-midnight date renders a day early in any negative-offset zone
