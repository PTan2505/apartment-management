## 1. The model

- [x] 1.1 `ServiceFeeBasis` enum; `basis` and `appliedByDefault` on the catalogue, defaulting to today's behaviour
- [x] 1.2 `basis` copied onto a tenancy's selection, beside the price it already copies
- [x] 1.3 Migration; existing rows read as per-room and not automatic

## 2. Charging

- [x] 2.1 A per-person fee is charged against the tenancy's occupant count at billing time
- [x] 2.2 Its line records that head count as its quantity, so the bill shows the arithmetic
- [x] 2.3 Per-room fees, rent, electricity and water are untouched
- [x] 2.4 Proration by days still applies to both

## 3. Taking one up

- [x] 3.1 A quantity supplied for a per-person fee is refused, not ignored
- [x] 3.2 Creating a tenancy takes up its building's default fees, in the same transaction
- [x] 3.3 Marking a fee default changes no tenancy that already exists

## 4. What the bill says

- [x] 4.1 A fee's line records the period THAT FEE applied for, not the tenancy's month
- [x] 4.2 A prorated fee can be checked from its own line: days shown match days charged

## 5. The screens

- [x] 5.1 The fee form asks per room / per person, in terms of the bill
- [x] 5.2 And whether it applies to new tenancies, saying existing ones are unaffected
- [x] 5.3 A fee's row says what it is charged per
- [x] 5.4 A tenancy shows a per-person fee against the head count, with no quantity box
- [x] 5.5 Attaching a fee makes the start date an explicit choice — no silent backdating
- [x] 5.6 Choosing a date before an already-billed month says those invoices do not change

## 6. Strings

- [x] 6.1 New Vietnamese strings reported for review

## 7. Checks

- [x] 7.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [x] 7.2 A per-person fee billed, then an occupant added and the next month billed — the amount follows
- [x] 7.3 A default fee picked up by a newly signed tenancy and NOT by an existing one
- [x] 7.4 In a visible browser: set both options, sign a tenancy, read the monthly total — 1440px and 390px
- [x] 7.5 A fee attached mid-month: its line shows its own days, and an earlier unbilled month is NOT charged
