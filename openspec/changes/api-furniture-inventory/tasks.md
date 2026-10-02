## 1. The three levels

- [ ] 1.1 `FurnitureCondition` enum; `FurnitureItem` per building; name unique among offered
- [ ] 1.2 `RoomFurniture` — quantity, value copied, current condition, acquired date
- [ ] 1.3 `LeaseFurniture` — values and hand-over condition copied, return condition nullable
- [ ] 1.4 Migration; nothing existing changes meaning

## 2. The catalogue

- [ ] 2.1 Add, correct, retire, restore — owner only; a manager reads
- [ ] 2.2 A duplicate name among offered entries is refused with the reason
- [ ] 2.3 A retired entry is not offered to a room

## 3. A room's furniture

- [ ] 3.1 Add from the catalogue with a quantity; value copied at that moment
- [ ] 3.2 Change quantity and condition; remove a holding
- [ ] 3.3 Re-pricing the catalogue leaves furnished rooms alone
- [ ] 3.4 Reported on a room with no tenancy — the question that started this
- [ ] 3.5 Owner writes; manager reads

## 4. The hand-over record

- [ ] 4.1 Written inside lease creation's transaction, from what the room holds then
- [ ] 4.2 An empty record for an unfurnished room — distinct from no record
- [ ] 4.3 Immutable: no endpoint changes a value or a hand-over condition
- [ ] 4.4 A later change to the room does not reach it

## 5. Checking in

- [ ] 5.1 Move-out accepts a return condition per item, optional
- [ ] 5.2 Unchecked is a third state, reported as such
- [ ] 5.3 Items worse than handed over are reported, with their hand-over value
- [ ] 5.4 Nothing is deducted and no invoice is issued by the move-out itself

## 6. The screens

- [ ] 6.1 The building's page maintains the catalogue, saying it furnishes nobody by itself
- [ ] 6.2 A room's page lists its furniture and says what the list is for
- [ ] 6.3 A tenancy shows its hand-over record as a frozen record, not a live list
- [ ] 6.4 Move-out lists the record and takes conditions; skipping says "unchecked"
- [ ] 6.5 Damage offers an ad-hoc invoice, prefilled and refusable
- [ ] 6.6 Tenancies signed before this exists say "no record", not "handed over nothing"
- [ ] 6.7 A manager sees everything and is offered nothing

## 7. Strings

- [ ] 7.1 New Vietnamese strings reported for review

## 8. Checks

- [ ] 8.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [ ] 8.2 Furnish a room, sign a tenancy, then CHANGE the room — the record must not move
- [ ] 8.3 Close that tenancy marking one item damaged; the offered invoice carries its value
- [ ] 8.4 Decline the offer — conditions kept, no invoice, deposit untouched
- [ ] 8.5 Close one without checking anything — succeeds, everything reads "unchecked"
- [ ] 8.6 A tenancy that predates this change reads "no record"
- [ ] 8.7 In a visible browser — 1440px and 390px
