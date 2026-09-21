## 1. Closing a tenancy

- [x] 1.1 "Kết thúc hợp đồng" on a running tenancy, withheld where one is already ended or cancelled
- [x] 1.2 Dialog: the date the tenant left and the closing reading, with the room's last known reading in view
- [x] 1.3 States what closing does — final bill, occupants departed, room freed — before the confirm
- [x] 1.4 A refusal stays in the dialog and changes nothing

## 2. Days beyond the term

- [x] 2.1 Where the date is after the agreed end, the dialog says so
- [x] 2.2 Charges named from the building's fee catalogue, amounts the owner's own
- [x] 2.3 Naming nothing is accepted as a waiver

## 3. The deposit afterwards

- [x] 3.1 A finished tenancy shows held, deducted, and still unpaid on invoices
- [x] 3.2 The owner can record the return, confirmed, with the amount named — exercised on a tenancy holding 0 ₫, so the wording was read but a non-zero return was not
- [x] 3.3 A returned deposit shows its date and is not offered again

## 4. The message that pointed at nothing

- [x] 4.1 `LAST_OCCUPANT_CANNOT_DEPART` names the action that now exists

## 5. Strings

- [x] 5.1 New and corrected Vietnamese strings reported for review

## 6. Checks

- [x] 6.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`

## 7. Verify in a visible browser

- [x] 7.1 Close a tenancy: finished, final bill issued, occupants departed, room free — read back from the API
- [x] 7.2 A closing reading below what was invoiced is refused, in the dialog, changing nothing
- [x] 7.3 A late departure offers the fee rows — an on-time tenancy was not tried, and no charge was actually named
- [x] 7.4 The settlement shows the three figures, and the return records with its date
- [x] 7.5 The action is absent on a finished and on a cancelled tenancy
- [x] 7.6 The last-occupant refusal names an action visible on the same screen
- [x] 7.7 390px
