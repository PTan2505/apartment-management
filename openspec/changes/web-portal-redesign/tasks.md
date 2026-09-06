## 1. What the tenant lands on

- [x] 1.1 Open the most recent bill on arrival, leaving the rest collapsed
- [x] 1.2 Keep every card collapsible and expandable exactly as it is today — this changes initial state, not behaviour
- [x] 1.3 Lead an unpaid bill with what is owed, so the amount and the state read together
- [x] 1.4 Keep a settled bill visibly settled and out of the way

## 2. The charges

- [x] 2.1 Give each charge the design's typography, with its working subordinate rather than at the same weight
- [x] 2.2 Keep every figure a tenant can check today: quantity, rate, period, and the meter readings — reordering may not drop one
- [x] 2.3 Keep the owner-written charge shown as itself, not demoted under a category
- [x] 2.4 Keep the total, and keep it equal to the charges above it

## 3. Header and identity

- [x] 3.1 Put the room and the person the bill is addressed to in a header
- [x] 3.2 Confirm no field the API does not report has appeared: no building name or address, no due date, no settlement date, no reconciliation period, no freshness timestamp, no support number

## 4. What must not be said

- [x] 4.1 Do not write the seven-day expiry sentence anywhere — the token has no lifetime, and the sentence would be false
- [x] 4.2 Keep the "link no longer works" state, saying what it can honestly say and not asserting an expiry
- [x] 4.3 Do not build the mockup's "other states" illustration panel into the working screen
- [x] 4.4 Leave the transfer details behind the tenant's press — the call that produces them creates a payment record

## 5. Verification, in a visible browser

The closing line of the request asked for building and month filters and a row click. The portal has no filters, no table and one screen; these are the checks that mean something here.

- [x] 5.1 Ensure the local database has a tenant with several bills, at least one paid and one unpaid — a screen verified with one bill is not verified
- [x] 5.2 Issue a portal link and open it in a browser that has never held a session, at phone width
- [x] 5.3 Confirm the newest bill is expanded on arrival and the others are not, read from the DOM rather than a screenshot
- [x] 5.4 Read an unpaid bill back: the amount owed, and that it says it is unpaid
- [x] 5.5 Add up the charges shown and check they equal the total shown — the figure, not the impression
- [x] 5.6 Confirm each of quantity, rate, period and meter readings is still present on a bill that carries them
- [x] 5.7 Collapse the open bill and expand another, confirming both still work
- [x] 5.8 Press to pay, and confirm the transfer details appear only then
- [x] 5.9 Search the rendered page for any claim about the link expiring, and confirm there is none
- [x] 5.10 Revoke the link and reopen it: confirm it says the link no longer works, and does not say it expired
- [x] 5.11 Scroll the whole page as a thumb would, with horizontal overflow measured at every position and not only at the top
- [x] 5.12 `tsc --noEmit` and `npm run lint` pass, and the production build still succeeds

## 6. The branch that could not be exercised, and why

- [x] 6.1 Establish whether a bill can carry meter readings WITHOUT an electricity charge, rather than leaving the branch unverified. It cannot: both writes of a reading are inside `generateInvoice`, which builds lines through `buildLineItems`, which pushes the electricity line unconditionally
- [x] 6.2 Keep the branch anyway, and say why in the code — the coupling lives in the billing module while the code depending on it lives in the portal, so making the electricity line conditional would silently stop the readings appearing
- [x] 6.3 Correct the comment that justified it with a wrong example: a final bill was cited, and a final bill gets an electricity line like any other
