## 1. The action

- [x] 1.1 "Gia hạn hợp đồng" on a running tenancy, withheld where a move-out or cancellation is recorded

## 2. The dialog

- [x] 2.1 Asks the closing meter reading and the new term, and nothing the successor inherits
- [x] 2.2 Shows the successor's start date, the occupants carried over, and the service fees at current prices
- [x] 2.3 The rent is filled from the room's current rent and can be changed
- [x] 2.4 Where the required deposit differs from what is held, names the difference and offers both ways to settle it
- [x] 2.5 Names both invoices — the predecessor's final bill and the successor's move-in bill — before the confirm
- [x] 2.6 A refusal stays in the dialog and changes nothing

## 3. After it succeeds

- [x] 3.1 The owner lands on the successor, which names the tenancy it renewed

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit` both sides, lint, both builds

## 6. Verify in a visible browser

- [x] 6.1 Renew a running tenancy: predecessor closed on its agreed end date, successor open from that day — read back from the API
- [x] 6.2 The occupants carried without being entered — service fees shown as inherited, but the test tenancy carried none, so that half is unproven
- [x] 6.3 A rent raised on the room shows up filled in, and a change to it is what the successor carries
- [x] 6.4 Both invoices exist afterwards, and the amounts match what the dialog said
- [x] 6.5 The action is absent on a finished and on a cancelled tenancy
- [x] 6.6 390px
