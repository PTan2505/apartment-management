## 1. The summary band

- [x] 1.1 Give the screen a header stating the room, the person responsible, the tenancy's state, the phone, and when the record was opened
- [x] 1.2 Compute the remaining term from the dates already on the object, and show it only while the tenancy is running
- [x] 1.3 Say what happened instead on a tenancy that has ended, moved out, or was cancelled — never a remaining time of zero
- [x] 1.4 Move the existing actions into the band without altering what any of them does

## 2. The terms, reordered and renamed

- [x] 2.1 Order the terms so rent and deposit lead
- [x] 2.2 Apply the four approved labels, and leave every other Vietnamese string exactly as it is
- [x] 2.3 Keep the deposit's months beside its amount — the amount alone can be checked against nothing
- [x] 2.4 Leave `occupantCount` where it already reads — on the occupants card under "Tính tiền cho", with the caption keeping it distinct from the people recorded. A copy on the terms card would be a second label for one fact
- [x] 2.5 Confirm no field the API does not report has appeared: no contract code, no notice period, no payment cycle, no water reading

## 3. The contract card

- [x] 3.1 Apply the filled and empty treatments from the design, driven by `hasContract` alone
- [x] 3.2 State the size limit and accepted formats an upload is actually held to
- [x] 3.3 Keep the unconfigured-storage case saying so rather than offering an upload that will fail
- [x] 3.4 Confirm no file name, size, upload time or storage location reaches the screen

## 4. The billing panel

- [x] 4.1 Add `LeaseInvoicesPanel` under `features/leases/`, reading `useInvoices({ leaseId })` — no new hook, no change to `api.ts`
- [x] 4.2 List invoices newest period first, each with its period, amount, and whether it is collected
- [x] 4.3 State the number issued from the list's own total, and the outstanding balance as a figure
- [x] 4.4 When there is more than is shown, say how many of how many and that the balance covers only those — with NO route out, because the invoice screen narrows by room and a room outlives its tenancies
- [x] 4.5 Make each row open its invoice
- [x] 4.6 Give the panel its own loading, empty and failure states, so a billing failure does not take the terms down with it

## 5. Layout

- [x] 5.1 Two columns on desktop, terms and contract beside billing
- [x] 5.2 Stacked on a phone, billing last
- [x] 5.3 `tsc --noEmit` and `npm run lint` pass in both packages

## 6. Verification, in a visible browser

- [x] 6.1 Seed the local database if a lease with several invoices — some collected, some not — does not already exist
- [x] 6.2 Sign in from a signed-OUT browser, asserting the sign-in form is present before typing into it
- [x] 6.3 Desktop pass in a maximised window at the full width of the display, not an emulated viewport
- [x] 6.4 Filter the leases list by building, and read the row count back
- [x] 6.5 There is NO month filter on the leases screen — it narrows by building, room, person and status. Filtered by status instead, and read the row count back
- [x] 6.6 Click a row through to its detail, and read the resulting path back
- [x] 6.7 Read the header back as values: room, tenant, state, remaining time
- [x] 6.8 Open a tenancy that has ENDED and confirm it reports no remaining time
- [x] 6.9 Read the billing panel back: row count, the stated total, the stated balance — and check the balance against the rows rather than trusting the figure
- [x] 6.10 Open an invoice from the panel and read the path back
- [x] 6.11 NOT EXERCISABLE, and said so rather than claimed: `issueMoveInInvoice` runs unconditionally inside lease creation, so every tenancy owns an invoice from birth. The branch is kept as a guard; it was never reached
- [x] 6.12 Confirm the terms still read while the billing panel is failing
- [x] 6.13 Mobile pass at 390px, slower, scrolling the page as a thumb would, with horizontal overflow measured at every scroll position and not only at the top
- [x] 6.14 Confirm the dialogs this change did not touch still open and still work: edit terms, add occupant, upload contract
