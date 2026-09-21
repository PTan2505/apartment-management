## 1. A tenancy always has somebody in it

- [x] 1.1 Departing the only current occupant is refused, with a message naming the tenancy's move-out
- [x] 1.2 A tenancy that already recorded its move-out is unaffected

## 2. The handover rides with the departure

- [x] 2.1 `successorId` accepted on the departure request, validated as a current occupant other than the leaver
- [x] 2.2 Both writes in one transaction
- [x] 2.3 Departing the responsible occupant with others remaining and no successor is still refused

## 3. The screen

- [x] 3.1 No departure action for the only current occupant, and it says what applies instead
- [x] 3.2 The dialog sends the handover with the departure, in one request

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`, `atomic:check`

## 6. Verify in a visible browser

- [x] 6.1 A tenancy with one occupant offers no departure, and says what to do
- [x] 6.2 A tenancy with two: departing the non-responsible one works, the other stays
- [x] 6.3 Departing the responsible one asks who takes over, and one request does both — read back from the API
- [x] 6.4 A refusal from the API is reported and nothing changed
- [x] 6.5 390px
