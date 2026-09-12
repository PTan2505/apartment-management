## 1. One definition of "this person holds a room"

- [x] 1.1 A helper in `leases/occupancy.ts`, beside `HOLDS_ITS_ROOM`
- [x] 1.2 It reads through the lease, NOT `leftAt` alone — a cancelled tenancy records no departure
- [x] 1.3 It returns the room, so the refusal can name it
- [x] 1.4 It takes a client, so it can run inside a transaction

## 2. Close both doors

- [x] 2.1 `createLease` — refuse a signatory who currently occupies another room
- [x] 2.2 `addOccupant` — refuse somebody who currently occupies another room
- [x] 2.3 Keep the existing same-lease check: "already in THIS lease" is a different message
- [x] 2.4 Two error codes, `SIGNATORY_ALREADY_HOUSED` and `OCCUPANT_ALREADY_HOUSED`
- [x] 2.5 Regenerate the frontend error-code list and write the Vietnamese sentences

## 3. Verify against the running API

- [x] 3.1 Reproduce the bug BEFORE the fix — one customer reached THREE rooms at once (Z42939A, Z42939B, Z42939C): signing for a housed person returned 201, and so did adding them as an occupant elsewhere
- [x] 3.2 Signing for somebody housed elsewhere is refused, and the message names the room
- [x] 3.3 Adding an occupant housed elsewhere is refused, and the message names the room
- [x] 3.4 Somebody whose other tenancy ENDED is accepted
- [x] 3.5 Somebody whose other tenancy was CANCELLED is accepted — the case `leftAt` alone gets wrong. Read back before signing: the cancelled tenancy still had 1 occupant with `leftAt = null`, so a check on that column alone would have refused them, citing a room they never lived in
- [x] 3.6 Adding somebody already in THIS lease still reports the old message, not the new one
- [x] 3.7 `extendLease` still carries its occupants forward
- [x] 3.8 A first-time person is still accepted — the guard must not refuse everybody
- [x] 3.9 `tsc --noEmit`, `codes:check`, `atomic:check` and the build all pass

## 4. Verify in a real browser, signed out at the start

- [x] 4.1 The refusal reads as a Vietnamese sentence, not a code
- [x] 4.2 Desktop and 390px — the refusal renders under "Người đứng tên" with the Phòng field carrying nothing, no overflow at 390px, and the sentence wrapping to two lines (34px tall) rather than being cut. CAVEAT, stated rather than buried: the 390px pass ran with touch emulation OFF. What it proves is the layout at that width; it does not prove operating the form with a finger

## 5. One more defect, found by verifying rather than by reading

- [x] 5.1 `LeaseFormDialog` attributes EVERY 409 to the room field — a fair default when the only conflict was "that room is taken", and exactly wrong here. "Người này đang thuê phòng Q54299A" under a field labelled Phòng reads as a complaint about the room just picked, and sends the owner to change the one answer that was right. Now attributed to the signatory, verified in the browser: the message renders under "Người đứng tên" and the Phòng field carries nothing

## 6. Measurement problems, recorded because each one looked like a defect

- [x] 6.1 3.4 first "failed" because the move-out could not be set up: a tenancy starting and ending the same day has nothing to bill, so the API answered INVOICE_FINAL_MONTH_EMPTY and the person was never freed. Re-run with a later date
- [x] 6.2 3.7 first "failed" because the harness read the successor from the extend response at a path that does not exist. The successor is a separate lease on the same room; read that way, the occupant carried across and the predecessor's was marked departed
- [x] 6.3 The mobile pass could not open the room menu: with touch emulation on, `Input.dispatchMouseEvent` does not open a MUI Select. It reported "Chọn phòng" as though the screen had refused, when the request was never made. Taps now go through `Input.dispatchTouchEvent`, and the script stops rather than measuring on a form with no room
- [x] 6.4 I corrupted one of my own runs by pointing a debug script at the same page while the pass was mid-flight
- [x] 6.5 Six clicks landed on nothing and looked exactly like a screen that would not respond. `setDeviceMetricsOverride` does NOT clear `setTouchEmulationEnabled`, so a browser window inherits touch from whatever ran in it before. A fresh window fixed it in one click
- [x] 6.6 The harness's CDP calls had no timeout, so a session that stopped answering hung forever instead of failing. Added one
