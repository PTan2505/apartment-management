## 1. Strings

- [x] 1.1 Invoice list: filter "Kể cả đã thu hồi" and chip "Đã thu hồi"
- [x] 1.2 Void dialog: title, body (with "của" replacing the English "for"), notice, field label, button and busy label
- [x] 1.3 Invoice screen: chip, notice title, no-reason sentence, "Thu hồi ngày", action button, paid-bill notice
- [x] 1.4 Tenancy invoice panel: chip "Đã huỷ" → "Đã thu hồi"
- [x] 1.5 Cancellation dialog: "Hoá đơn đó sẽ được thu hồi, để không còn bị tính là tiền nợ."
- [x] 1.6 `error-messages.ts`: the four messages that name the state
- [x] 1.7 Scan `frontend/src` string literals: no "rút" left, and no "Đã huỷ" attached to an invoice; "Đã huỷ" for a cancelled tenancy remains — grep: zero "rút"; the three remaining "Đã huỷ" are the tenancy status chip, the list chip and the cancelled-tenancy sentence

## 2. Local documents (not committed)

- [x] 2.1 `TEST-THU-CONG.md` line 29 and step 5.6 say "đã thu hồi"
- [x] 2.2 `SCREENS.md` invoice-panel line says "đã thu hồi"; "rút gọn" elsewhere untouched
- [x] 2.3 Both remain gitignored and untracked

## 3. Checks

- [x] 3.1 `tsc --noEmit`, lint, a production build, and `codes:check`

## 4. Verify in a visible browser, signed out at the start

- [x] 4.1 P101's invoice panel shows "Đã thu hồi" on the September bill; open it — the invoice screen's chip and notice say "thu hồi" ("Hoá đơn này đã bị thu hồi", "Thu hồi ngày 05/09/2026")
- [x] 4.2 Invoice list with "Kể cả đã thu hồi" ticked: withdrawn bills show "Đã thu hồi"
- [x] 4.3 On an unpaid bill, open "Thu hồi hoá đơn": read back the title, body, notice, field label and button; no English, and "của" in the body. Close with "Giữ hoá đơn" without withdrawing
- [x] 4.4 On a paid bill, the notice reads "Muốn thu hồi hoá đơn này thì phải đảo giao dịch trước"
- [x] 4.5 A cancelled tenancy (Q54299E) still reads "Đã huỷ" as a tenancy, and its withdrawn move-in bill — if listed — reads "Đã thu hồi" — both chips on one screen, read back: ["Đã huỷ","Người đứng tên","Đã thu hồi"]
- [x] 4.6 Every string read back from the page, not from the source
- [x] 4.7 390px: the longer chips and the action button fit without overflow, measured at scroll positions that actually differ — P101 at 6 positions, invoice 392 at 3; page scrollWidth 390 throughout. The invoice's line-item table is 461px wide inside its own `overflow-x: auto` container (324px), which CLAUDE.md allows; the first scan flagged it because it counted any element past the viewport, including ones clipped by a scroll container. Touch emulation off: layout proven, not finger operation

## 5. Notes from verification

- [x] 5.1 Desktop: 49 of 49 across both changes, from a signed-out start. 390px: 9 of 10 on the first run — the one failure was the line-item table flagged by an over-strict overflow check, re-measured in 4.7 and found inside its own scroll container with the page not overflowing
- [x] 5.2 The void dialog was opened on unpaid invoice #369 and closed with "Giữ hoá đơn"; #369 was confirmed still not withdrawn afterwards
- [x] 5.3 Invoice #390 (P101, 10/2026) was found withdrawn during verification — at 15:56:33 on 12/09/2026, reason "test". No verification script types a withdrawal reason; the owner confirmed they withdrew it by hand while testing. It is why the 390px pass saw "Đã thu hồi" on the 10/2026 row, which was correct data, not a rendering fault — confirmed by dumping every panel row at both widths
- [x] 5.4 Found while investigating 5.3: #390 still carries a PENDING gateway payment (#63). See the note in the final report about whether a gateway confirmation can mark a withdrawn invoice paid — outside this change's scope
