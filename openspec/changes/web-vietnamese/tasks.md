# Tasks

## 1. Shared surfaces first

- [x] 1.1 Navigation, app shell, account menu.
- [x] 1.2 Shared components: pagination, empty states, the not-found page.
- [x] 1.3 Vietnamese month names in the date helpers, keeping `dd/mm/yyyy` and the exclusive-ending convention untouched.
- [x] 1.4 Sign-in.

## 2. The record-keeping screens

- [x] 2.1 Buildings — list, form, detail, retire.
- [x] 2.2 Rooms — list, form, retire, and the meter-reading field just added.
- [x] 2.3 Customers.

## 3. Tenancies

- [x] 3.1 Leases list and filters.
- [x] 3.2 Lease detail, terms, occupants.
- [x] 3.3 The dialogs: new lease, edit terms, add and depart occupant, transfer responsibility, cancel.
- [x] 3.4 Keep **huỷ hợp đồng** and **trả phòng** distinct throughout. The whole reason cancellation exists is that the two are different events, and one word for both would undo it in the language layer.

## 4. Money

- [x] 4.1 Invoices list, filters, detail, charges.
- [x] 4.2 The billing round.
- [x] 4.3 Payment and reversal dialogs.
- [x] 4.4 Withdrawing a bill — **rút**, kept as a record.
- [x] 4.5 Expenses list, form, and the empty-rooms round.
- [x] 4.6 Removing a cost — **xoá**, gone outright. The contrast with 4.4 is deliberate and must survive.

## 5. The revenue screen

- [x] 5.1 Rename the figures by the question each answers, not word-for-word. `Settled` translated literally is as opaque as it was.
- [x] 5.2 Keep the naming of billed / collected / owed showing that the last two are parts of the first.
- [x] 5.3 Name the cash figure so it cannot be read as one of the other three, and keep it in its own section with its explanation.
- [x] 5.4 Breakdown labels and the link to unpaid bills.

## 6. Verification

- [x] 6.1 **Open every screen and read it.** A missed string is invisible to a typecheck, so this is the only check that finds one.
- [x] 6.2 Sweep for surviving English: any remaining Latin-script label that is not a proper noun, a unit, or a room code.
- [x] 6.3 Open every dialog — they hold a large share of the strings and none of them is visible from a list.
- [x] 6.4 Trigger the validation messages a form judges itself: a required field, a reading below its opening figure, a settlement that does not add up.
- [x] 6.5 Trigger the empty states: a filter matching nothing, a month with nothing to bill, a month with no empty rooms.
- [x] 6.6 **Vocabulary is consistent**: the same concept carries the same word on every screen it appears.
- [x] 6.7 **Cancelled and finished tenancies still read differently**, in the list and on the tenancy.
- [x] 6.8 **Withdrawing a bill and removing a cost still read differently** — kept versus gone.
- [x] 6.9 Month names are Vietnamese wherever a month is shown: billing round, empty rooms, invoices, revenue.
- [x] 6.10 **Nothing behaves differently**: create a tenancy, bill a month, record a payment, record a cost, read the report.
- [x] 6.11 Typecheck and build.
- [x] 6.12 Remove any verification data.
