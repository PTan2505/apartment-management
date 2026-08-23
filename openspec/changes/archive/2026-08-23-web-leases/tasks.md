# Tasks

## 1. A room says whether it is let

- [x] 1.1 Report on every room whether a tenancy is currently running in it — the same way whether listed or retrieved singly. The system already computes this to refuse retiring an occupied room; expose what it knows.
- [x] 1.2 Resolve it for a listed page in one lookup over that page's rooms, not one per room.
- [x] 1.3 Report occupancy only. Not the tenancy's terms, tenant or dates — those belong to the tenancy, and copying them into every room is the duplication the room's building representation already avoids.
- [x] 1.4 Add a filter for rooms with no running tenancy, combinable with the existing ones.
- [x] 1.5 A tenancy past its term with no move-out still holds its room. It is not free to let again, and reporting it vacant would offer a room that cannot be taken.
- [x] 1.6 `tsc --noEmit` on the backend.

## 1b. A lease says which room it is for, and recent ones come first

Found while reading the API against what the screens need. Both are shape problems, not presentation ones, and neither can be corrected in the browser.

- [x] 1b.1 Report the room on every lease — id, code, and the building's id and display name — the same way whether listed or retrieved singly.
- [x] 1b.2 Limit it to what identifies the room. Not its rent, its status, or whether it is let: the lease has its own agreed rent, and two rents on one screen is how the wrong one gets read.
- [x] 1b.3 Order the listing most recently begun first, with the more recently recorded breaking a tie. Without the tiebreak the order is not total, and a lease can appear on two pages or on none.
- [x] 1b.4 Resolve the room for a listed page without a query per lease.
- [x] 1b.5 `tsc --noEmit`, and check an existing caller of the lease listing still reads correctly.
- [x] 1b.6 Report the move-out date. Only a status reaches callers today, which says a tenancy is over but not when — so a tenancy that ran its term cannot be told from one closed early or late. Exclusive, like the expected end date: two dates on one screen read on opposite conventions is a defect waiting to be found.

## 2. Seeing tenancies

- [x] 2.1 List leases, most recently begun first, each with its room, tenant, rent, dates and whether it is running.
- [x] 2.2 Say so where a lease has no recorded tenant. It is a state the system allows, and a blank reads as a record gone missing. **Real data changed this:** recording a move-out departs the occupants, so EVERY ended tenancy reports no tenant. Marking both alike in warning colour would have flagged every finished tenancy and buried the one case that matters — a RUNNING tenancy with nobody answerable. The two now read differently: "Nobody responsible" against "No tenant recorded".
- [x] 2.3 **Mark a tenancy whose term ran out unclosed, in the list itself.** A filter finds these only for somebody who already suspects them, and the difficulty is that nothing announces them. **A mark turned out not to be enough:** the list is ordered most recently begun first, and these are usually the OLDEST tenancies — so they sink to the last page, the one nobody opens. Built with 24 tenancies, page one carried zero marks while two needed chasing. The screen now states the count wherever the owner is, with the filter one press away, and hides it while that filter is already applied.
- [x] 2.4 Filter by room, by person, by running, and by term-run-out. Filters combine, and the reported total describes the filtered set.
- [x] 2.5 Filtering by person finds every tenancy they occupied — not only ones they signed, and including ended ones.
- [x] 2.6 Paginate, reporting how many match rather than how many are on the page.

## 3. A tenancy in full

- [x] 3.1 A tenancy's own screen: room, tenant, rent, duration, the number billed for, the deposit, the dates.
- [x] 3.2 Show the deposit with the months it was agreed in. The amount alone cannot be checked against anything.
- [x] 3.3 **Show dates as the days actually covered.** The API's end date is the first day *not* covered; printing it unchanged sends an owner to the room a day late.
- [x] 3.4 Where a tenancy has ended, make both legible: what was agreed, and what happened.
- [x] 3.5 An address for a tenancy that does not exist says so, rather than rendering an empty one.

## 4. Signing one

- [x] 4.1 A create form: room, person responsible, start date, duration, number to bill for, deposit in months.
- [x] 4.2 Allow the agreed rent and opening meter reading to be given, and make clear what is used when they are not — the room's current rent, and the previous tenancy's closing reading. Leaving them out is a choice with a defined result, not an omission. **Found while using it:** the first wording promised a default that does not exist. The fallback is the PREVIOUS tenancy's reading, so a room never let before has nothing to fall back on and the API refuses — an owner would leave it blank on the strength of the hint and meet an error they were told would not happen. The condition is now stated.
- [x] 4.3 **Require the deposit; accept zero.** Defaulting a blank to zero makes "no deposit was taken" and "the deposit was not recorded" the same record, and only one is safe to act on.
- [x] 4.4 Offer only rooms with no running tenancy.
- [x] 4.5 Where the room was taken since the form opened, say the room is taken — and keep what was entered, because only the room is now wrong.
- [x] 4.6 Reachable from the leases screen and from a vacant room, the same form both ways, with the room already chosen on the second.
- [x] 4.7 On success, go to the tenancy created. What follows is always something on that tenancy.

## 5. Keeping it current

- [x] 5.1 Edit a running lease's duration and the number it bills for.
- [x] 5.2 Do not offer the action on a finished tenancy, rather than offering it and reporting the refusal.
- [x] 5.3 List occupants, current and departed, each with the dates they joined and left. Somebody who left stays visible — where a person lived and when is what these records are for.
- [x] 5.4 Add a person; refuse a current occupant in those terms; allow one who previously left, keeping the earlier record.
- [x] 5.5 **Lay out the number billed for and the people on file as separate facts.** They are separately maintained and may legitimately differ; a list of two under "5 occupants" reads as three lost records.
- [x] 5.6 Adding or departing somebody does not change the number billed for, and the screen must not imply it did.
- [x] 5.7 **Departing the responsible occupant offers the transfer it requires**, then performs both. Transfer first: if the second call fails the result is legible and repairable, and the reverse order is refused by the API anyway.
- [x] 5.8 Where nobody else remains, accept the departure — there is nobody to transfer to, and the tenancy then reports no tenant.
- [x] 5.9 Transferring responsibility on its own, without a departure.

## 6b. Narrowing by building

Asked for after the screens were built, and it turned out to need the API too: `/leases` could filter by room but not by building, so a building control would have narrowed the room dropdown while leaving the list unchanged — a control that looks like a filter and is not one.

- [x] 6b.1 Filter the lease listing by building, through the room rather than by copying a building id onto the lease. Combines with the room filter: naming both means a room within a building, and matches nothing when they disagree.
- [x] 6b.2 A building control on the leases screen, which also narrows the room list to that building. A flat list of every room across every building is unusable past a handful — and a room code alone is ambiguous anyway, because the same code exists in several buildings.
- [x] 6b.4 A building control on the create form too, narrowing the vacant rooms it offers. Not submitted — a lease is created against a room, which already knows its building. Choosing one clears any room already picked.
- [x] 6b.5 Force the meter field's label to float. It is filled programmatically, and MUI decides the label position from the input's own events — a value written straight into form state leaves the label sitting across the number it just filled in.
- [x] 6b.3 Changing the building clears any chosen room, in ONE update. Two updates do not compose: the second computes from the params the first captured and discards its change, leaving a room that belongs to a building no longer selected.

## 6. The rooms screen

- [x] 6.1 Show whether each room is let, read from what the API reports rather than assembled from tenancies.
- [x] 6.2 Offer to start a tenancy on a room in service with none; do not offer it on one that is let or retired.

## 7. Shape and verification

- [x] 7.1 Usable down to a phone's width; the page never scrolls sideways, and anything too wide scrolls within itself.
- [x] 7.2 Typecheck and build the frontend.

Most of this is a screen, so most of it is verified by using it. Where a claim is that something must NOT happen, check that specifically.

- [x] 7.3 Build tenancies covering the cases the screens are about: running, ended, term-run-out-unclosed, one with no tenant, and one billing for more people than it names.
- [x] 7.4 The term-run-out tenancy is distinguishable in the list **without any filter applied**.
- [x] 7.5 **The end date shown is the day covered through.** Check a lease starting 2026-01-01 for six months reads as covering through 30/06, and one with a move-out of 2026-07-05 as through 04/07.
- [x] 7.6 **The two occupant figures are both visible and neither is presented as the other**, on the tenancy billing for more people than it names.
- [x] 7.7 Creating from a room arrives with that room chosen; creating from the leases screen offers only vacant rooms — verified by confirming a let room is absent from the choices.
- [x] 7.8 Submitting for a room taken in the meantime reports the room as taken and keeps the entered values. Reproduce it by creating a tenancy on that room from elsewhere while the form is open.
- [x] 7.9 A blank deposit is refused; a deposit of zero is accepted.
- [x] 7.10 Departing the responsible occupant while another remains offers the transfer and completes both. Departing the last one is accepted and the tenancy then shows no tenant.
- [x] 7.11 A finished tenancy offers no way to edit its terms.
- [x] 7.12 **The rooms screen still works unchanged for everything else**, and a let room offers no way to start a tenancy.
- [x] 7.13 Readable at phone width.
- [x] 7.14 Remove the verification data.
