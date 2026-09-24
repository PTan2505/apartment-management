## 1. The API can answer it

- [x] 1.1 `from` and `to` accepted on the lease listing, each optional and independent
- [x] 1.2 `from` bounds `startDate`; `to` bounds the covering end — move-out where recorded, agreed end otherwise
- [x] 1.3 Cancelled tenancies match no period
- [x] 1.4 Absent, the listing behaves exactly as before

## 2. Columns that line up

- [x] 2.1 `Bắt đầu` and `Kết thúc` as separate columns, and `Phòng` and `Toà nhà` as separate columns
- [x] 2.2 The ending cell says whether it is a recorded move-out or an agreed end
- [x] 2.3 A cancelled tenancy presents no range
- [x] 2.4 The phone card keeps its single line

## 3. The filter

- [x] 3.1 From-date and to-date inputs, either alone or both
- [x] 3.2 The screen says what each bound does — begun on or after, ended on or before
- [x] 3.3 Survives a page change and a reload, like the other filters

## 4. The rooms list

- [x] 4.1 A let room reports its tenancy's id and the day it comes free, from the API
- [x] 4.2 That date is a column on the rooms list, empty for a vacant room
- [x] 4.3 Opening a let room opens the tenancy holding it; a vacant room behaves as before
- [x] 4.4 The phone cards carry the date too

## 5. Strings

- [x] 5.1 New Vietnamese strings reported for review

## 6. Checks

- [x] 7.1 `tsc --noEmit` both sides, lint, both builds

## 7. Verify in a visible browser

- [x] 7.1 Both bounds: a tenancy contained in the period is listed, one spanning past either end is not — read back against the API
- [x] 7.2 From-date alone, and to-date alone, each behave as stated
- [x] 7.3 A tenancy that ended early is judged on its move-out, not its agreed end
- [x] 7.4 A cancelled tenancy matches no period
- [x] 7.5 The two columns line up and the ending cell distinguishes the two kinds of end
- [x] 7.6 A let room shows its end date and opens the tenancy; a vacant one does not
- [x] 7.7 390px
