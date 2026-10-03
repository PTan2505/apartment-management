## 1. The three levels

- [x] 1.1 `FurnitureCondition` enum; `FurnitureItem` per building; name unique among offered
- [x] 1.2 `RoomFurniture` — quantity, value copied, current condition, acquired date
- [x] 1.3 `LeaseFurniture` — values and hand-over condition copied, return condition nullable
- [x] 1.4 Migration; nothing existing changes meaning

## 2. The catalogue

- [x] 2.1 Add, correct, retire, restore — owner only; a manager reads
- [x] 2.2 A duplicate name among offered entries is refused with the reason
- [x] 2.3 A retired entry is not offered to a room

## 3. A room's furniture

- [x] 3.1 Add from the catalogue with a quantity; value copied at that moment
- [x] 3.2 Change quantity and condition; remove a holding
- [x] 3.3 Re-pricing the catalogue leaves furnished rooms alone
- [x] 3.4 Reported on a room with no tenancy — the question that started this
- [x] 3.5 Owner writes; manager reads

## 4. The hand-over record

- [x] 4.1 Written inside lease creation's transaction, from what the room holds then
- [x] 4.2 An empty record for an unfurnished room — distinct from no record
- [x] 4.3 Immutable: no endpoint changes a value or a hand-over condition
- [x] 4.4 A later change to the room does not reach it

## 5. Checking in

- [x] 5.1 Move-out accepts a return condition per item, optional
- [x] 5.2 Unchecked is a third state, reported as such
- [x] 5.3 Items worse than handed over are reported, with their hand-over value
- [x] 5.4 Nothing is deducted and no invoice is issued by the move-out itself

## 6. The screens

- [x] 6.1 The building's page maintains the catalogue, saying it furnishes nobody by itself
- [x] 6.2 A room's page lists its furniture and says what the list is for
- [x] 6.3 A tenancy shows its hand-over record as a frozen record, not a live list
- [x] 6.4 Move-out lists the record and takes conditions; skipping says "unchecked"
- [x] 6.5 Damage offers an ad-hoc invoice, prefilled and refusable
- [x] 6.6 Tenancies signed before this exists say "no record", not "handed over nothing"
- [x] 6.7 A manager sees everything and is offered nothing

## 7. Strings

- [x] 7.1 New Vietnamese strings reported for review

## 8. Checks

- [x] 8.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [x] 8.2 Furnish a room, sign a tenancy, then CHANGE the room — the record must not move
- [x] 8.3 Close that tenancy marking one item damaged; the offered invoice carries its value
- [x] 8.4 Decline the offer — conditions kept, no invoice, deposit untouched
- [x] 8.5 Close one without checking anything — succeeds, everything reads "unchecked"
- [x] 8.6 A tenancy that predates this change reads "no record"
- [x] 8.7 In a visible browser — 1440px and 390px
