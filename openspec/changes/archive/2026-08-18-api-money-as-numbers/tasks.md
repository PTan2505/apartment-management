## 1. Backend

- [ ] 1.1 Create feature branch `feature/api-money-as-numbers` off `dev`
- [x] 1.2 Override `Decimal.prototype.toJSON` in `backend/src/lib/prisma.ts` to return a number, with a comment naming the behaviour, the reason, and the precision headroom that makes it safe
- [x] 1.3 Confirm the override is in effect before any query runs, without an explicit initialisation call from anywhere else
- [x] 1.4 Run `tsc --noEmit` and confirm it passes

## 2. Verification — the API

- [x] 2.1 Verify a building response returns `electricityRate` and `waterRatePerPerson` as numbers, including fractional rates
- [x] 2.2 Verify a room response returns `baseRent` as a number
- [x] 2.3 Verify an invoice response returns `rentAmount`, `electricityAmount`, `waterAmount`, and `totalAmount` as numbers, and the recorded rate fields too
- [x] 2.4 Verify an expense response returns `amount` as a number, and `quantity` and `unitRate` as numbers when set
- [x] 2.5 Verify an expense with no `quantity` or `unitRate` returns them as null, not zero
- [x] 2.6 Verify the revenue report returns its computed figures as numbers, including months with no activity reporting zero rather than `"0"`
- [x] 2.7 Verify a paginated list returns numbers inside `data`, confirming the shared pagination wrapper does not re-serialise them
- [x] 2.8 Verify `phone` and `roomCode` are still text, retaining leading zeros
- [x] 2.9 Verify a value's precision survives the round trip by comparing a stored amount and rate against what the API returns

## 3. Frontend

- [x] 3.1 Delete `toMoney` and `mapMoneyFields` from `frontend/src/lib/money.ts`
- [x] 3.2 Move `formatMoney` to `frontend/src/lib/format.ts`, since display formatting is not transport, and delete `money.ts`
- [x] 3.3 Confirm nothing imports the removed helpers
- [x] 3.4 Run the frontend typecheck and confirm it passes

## 4. Verification — end to end

- [x] 4.1 Verify through the dev proxy that a monetary field arrives as a JavaScript number, not a string
- [x] 4.2 Verify `formatMoney` renders a number as Vietnamese dong, and renders a null amount as a placeholder rather than a zero
- [x] 4.3 Verify sorting a set of amounts orders them numerically
- [x] 4.4 Verify signing in still works, confirming the change did not disturb the auth flow

## 5. Wrap-up

- [x] 5.1 Refresh the local OpenAPI document so these fields are described as numbers
- [x] 5.2 Confirm all new or changed imports follow the `@/` alias convention and none use `../`
- [x] 5.3 Clean up verification data, leaving the seeded owner intact
- [ ] 5.4 Report the work for review, and commit only when asked
