# Tasks

## 1. The API returns what a code can be built from

- [x] 1.1 Widen the gateway response type to carry the bank, the account it allocated, the account name, the amount and the description. Twelve fields come back; three are declared, so the rest are dropped before anything sees them.
- [x] 1.2 Return those through the portal's pay endpoint, alongside the checkout link.
- [x] 1.3 **Return the gateway's account, never the owner's.** A code pointing at the owner's real account transfers money the gateway never sees, so no confirmation is sent and the bill stays unpaid with the money gone.
- [x] 1.4 Keep the gateway's own identifiers — the reference, the stored payload — out of what the tenant receives.
- [x] 1.5 Run `tsc --noEmit` on the backend.

## 2. A second application

- [x] 2.1 Add a separate browser application for tenants, built independently of the owner's.
- [x] 2.2 Give it its own HTTP client. The shared one refreshes a session on `401`, and a tenant has none to refresh.
- [x] 2.3 Address the API by a full address supplied at build time, and fail the build when it is absent rather than requesting paths on itself.
- [x] 2.4 Reuse the money formatting and the visual language; share no data fetching.

## 3. Opening a link

- [x] 3.1 Read the token from the URL fragment.
- [x] 3.2 Remove it from the address bar without navigating.
- [x] 3.3 Keep it for the browsing session so a reload does not lock the tenant out of a link they can no longer see.
- [x] 3.4 Show one message for a token that is missing, unknown, withdrawn or malformed. The API answers all four identically on purpose; saying more here would undo that.

## 4. Reading

- [x] 4.1 List the bills the token allows, most recently issued first, each with its kind, date, room, total and whether it is paid.
- [x] 4.2 Make paid and unpaid distinguishable without reading an amount.
- [x] 4.3 Open a bill to its charges: description, quantity and rate where there were any, period, amount.
- [x] 4.4 Show the meter readings on a bill that charged metered electricity. This is the thing a tenant cannot check any other way.
- [x] 4.5 Format money as a Vietnamese reader expects.
- [x] 4.6 Say so plainly when there are no bills.

## 5. Paying

- [x] 5.1 Offer to pay an unpaid bill, and show the code built from what the API returned.
- [x] 5.2 Show the amount and the account it reaches beside the code, so a tenant can check before transferring.
- [x] 5.3 Show the gateway's checkout link **always**, not only when the image fails — somebody who prefers a browser should not have to wait for a failure first.
- [x] 5.4 Handle the image failing to load: say so, leave the link usable.
- [x] 5.5 Report unavailability where the API says no gateway is configured, and leave the bill readable.
- [x] 5.6 Make an action in progress visible, and not startable twice.

## 6. Finding out it was paid

- [x] 6.1 Ask the API whether the bill has been paid, every few seconds, after a payment is started. Nothing else can tell the portal: a tenant scanning in their banking app never returns to this page.
- [x] 6.2 Stop on success and say so unmistakably.
- [x] 6.3 Stop after a few minutes, and offer to check again. A tab forgotten on a bus must not poll for an hour.

## 7. On a phone, and honest about waiting

- [x] 7.1 Readable at phone width without sideways scrolling — that is where a link sent by message is opened.
- [x] 7.2 Say the first load may take a moment before the wait, not after. The API sleeps when idle and takes around fifty seconds to wake, and fifty seconds of a spinner is indistinguishable from a broken page.
- [x] 7.3 Run typecheck and build on the frontend.

## 8. Verification

Most of this is a screen, so most of it is verified by using it. Where a claim is about what must NOT happen, check that specifically.

- [x] 8.1 Build a tenancy with paid, unpaid and voided bills, and issue a portal link for it.
- [x] 8.2 Opening the link shows the bills; **the address bar no longer contains the token**. Verified in a real browser: after load the URL is `…/portal.html` with no fragment, and the token is in `sessionStorage`.
- [x] 8.3 Reloading still works.
- [x] 8.4 Opening the portal in a new tab without the link says the link is no longer valid.
- [x] 8.5 **A revoked token and a made-up token produce the same message** — compared as displayed, not as fetched. Three causes checked — no token, a made-up one, and one the owner revoked mid-test — and all three render the identical string.
- [x] 8.6 Bills are newest first, and a paid one is distinguishable from an unpaid one at a glance.
- [x] 8.7 A monthly bill opens to its charges, they sum to the total, and the meter readings are shown. 3.000.000 + 175.000 + 200.000 = 3.375.000, with `Chỉ số điện: 0 → 50 (50 kWh)`.
- [x] 8.8 A voided bill is absent, and a bill from a tenancy the tenant never occupied is absent.
- [x] 8.9 Starting a payment shows a code, the amount, and the account.
- [x] 8.10 **The account shown is the gateway's virtual account, not the owner's own** — read it off the screen and compare with the owner's real account number.
- [x] 8.11 Asking to pay the same bill twice shows the same code, and creates no second attempt.
- [x] 8.12 The checkout link works and opens the gateway's page.
- [x] 8.13 Breaking the image address shows the failure message and leaves the checkout link usable.
- [x] 8.14 **A real payment of the smallest sensible amount, scanned from the code this screen renders.** Paid for real, 2.000 ₫, and the gateway accepted it — so the rendered code does encode what the gateway expects. **The bill did NOT flip on its own**, and the reason turned out to be a real defect rather than the test's fault: the confirmation went to the deployed API while the screen was talking to a local one, and the "Kiểm tra lại" button only re-read the local database, so the API's own recovery — ask the gateway what became of an attempt still held as waiting — was unreachable from the one screen that needed it. Fixed by routing that button through the same call that starts a payment, and treating the resulting conflict as success. Re-verified against the gateway's real answer for that same payment: one press, and the bill went from unpaid to paid.
- [x] 8.15 Polling stops once the bill is paid. **Found a real defect first**: the parent short-circuited on `isPaid`, so the panel vanished the instant the money landed and the success branch inside it was unreachable — to somebody watching the screen that reads as a failure. Fixed; the green confirmation now appears within ~3s of settlement and polling stops.
- [x] 8.16 Polling stops after the time limit and offers to check again. Sat through the full wait: stopped at ~240s exactly, with the button offered.
- [x] 8.17 Readable at phone width.
- [x] 8.18 The first request after the API has been idle shows the waiting message rather than a bare spinner. Reproduced against a listener that accepts and never answers — the closest thing to a sleeping host. **Found a second defect**: a request that never reaches the API rejects with `TypeError: Failed to fetch`, and that raw English string was shown to the tenant beside a spinner that turned for ever. Both fixed.
- [x] 8.19 **The tenant's screen never displays a gateway reference, a stored payload or a credential** — check the network responses, not only what is rendered.
- [x] 8.20 The owner's application still builds and runs unchanged.
- [x] 8.21 Remove the verification data, including any real payment made in 8.14. Local tenancies, bills, payments and portal tokens deleted; the seeded owner used for the test removed. The live payment links raised during verification are cancelled at the gateway — except the one that was genuinely paid, which it refuses to cancel, correctly: a settled payment is a record, not a pending offer.

**Known gap, deliberately left:** when recovery succeeds on a freshly loaded page there is no offer in memory, so the panel that carries the green "Đã thanh toán" never mounts and the only feedback is the status chip changing. On the path this change is about — pay, wait, press "Kiểm tra lại" — the offer is present and the confirmation shows. Closing the gap on the other path needs the API to say "already paid" in a way the screen can render, which is a change to what the API returns.
