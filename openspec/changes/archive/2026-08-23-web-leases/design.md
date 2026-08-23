## Context

See proposal.md — Why. The constraints that shape the approach: the API is complete apart from one gap found while drafting (a room does not report whether it is let), the owner application already has its shell, routing, shared query client and money formatting, and four features (`buildings`, `rooms`, `customers`, `auth`) establish the conventions this one follows.

The domain rules that the screens must not contradict are in `openspec/specs/lease/spec.md` and `openspec/specs/deposit/spec.md`. The ones that bite are named in the specs for this change; this document covers how they are handled, not what they are.

## Goals / Non-Goals

**Goals:**

- Make the three rules an owner is most likely to misread impossible to misread on screen: the exclusive end date, the two occupant figures, and a tenancy that has quietly run out.
- Add the missing fact to the room's representation once, rather than reconstructing it in two places in the browser.

**Non-Goals:**

- Extending, moving out, or returning a deposit. Each moves money and needs a reconciliation screen shown before the owner commits; bolting them on as confirmation dialogs is how a wrong figure gets accepted.
- Service fees attached to a lease. They are read-only context here, and their own management is separate work.
- Issuing invoices from the tenancy screen. That belongs with `web-invoices`, which will link back to the tenancy rather than the other way round.

## Decisions

**A room reports whether it is let, rather than the browser working it out.**

The alternative is a client-side derivation: list every active lease, build a set of room ids, subtract. It works, and it is wrong in three separate ways — it costs a second request that grows with the number of tenancies, its answer is stale the moment it is computed, and it puts a rule about occupancy in the browser where a second caller will reimplement it differently. The database already knows; `roomHasActiveLease` exists in the leases service and is called when refusing to retire an occupied room. This exposes what is already computed.

It reports occupancy only — a boolean — not the tenancy. Carrying the tenancy's terms into every room would duplicate a record into the thing that references it, which is the mistake the room's building representation was already careful to avoid.

**Dates are shown as the day covered through, not as the exclusive boundary.**

The API reports an expected end date that is the first day *not* covered. Passing that string to the screen unchanged is correct and useless: an owner reading it arranges the cleaner for the wrong day. The screen shows the covered-through day, computed by subtracting one day from the boundary the API reports.

The alternative — asking the API to report a covered-through date as well — was considered and rejected. The exclusive boundary is the one that makes renewals abut without a gap, and it is what every other part of the system computes with. A second date meaning almost the same thing is how two dates drift apart. This is genuinely presentation, so it belongs in presentation.

**The occupant count and the occupant list are laid out as separate things, not as a heading and its contents.**

They are separately maintained and may legitimately differ; the specs say so and the API refuses to reconcile them. The failure mode is a layout that implies otherwise — a list of two names under "5 occupants" — which reads as three lost records and invites an owner to "fix" a number that was already right. They are presented as what they are: how many people the room is billed for, and the people whose details are on file.

**Departing the responsible occupant offers the transfer, rather than reporting the refusal.**

The API answers 409 when the primary occupant is departed while others remain, because responsibility has to pass to somebody first. The obvious implementation surfaces that error. But the screen has everything needed to resolve it — it knows the other current occupants — so surfacing the refusal is a screen that knows what to do and declines to do it.

Two calls, in order: transfer, then depart. Not atomic, and it does not need to be. If the transfer succeeds and the departure fails, the result is a lease whose responsibility moved and whose occupant did not leave — visible, correct as far as it went, and repairable from the same screen. The reverse order would be the dangerous one, and it is not possible: the API refuses it.

**Where the room was taken between opening the form and submitting it, the refusal is reported in those terms.**

The API answers 409 for a room that already has a running tenancy. The form keeps what was entered rather than clearing — the owner's other answers are still correct, only the room is not.

**Creating a lease navigates to the lease it created.**

Rather than returning to the list. What follows creating a tenancy is always something on that tenancy: adding the other occupants, checking the deposit. Returning to a list means finding it again.

## Risks / Trade-offs

**Adding a field to the room representation touches every existing caller** → It is additive and optional to read; the rooms screen and the building's room list continue to work unchanged. The vacancy filter is opt-in.

**Computing occupancy for a listed page costs a query per page, not per room** → It resolves as a single grouped lookup over the page's room ids. If it ever became the slow part, the fix is an index, not a different shape.

**Subtracting a day for display is a computation that can be wrong at a boundary** → It is a date-only subtraction on a date the API reports date-only; no timezone is involved. The scenarios pin two concrete cases, including a move-out, so a regression fails a check rather than being noticed by an owner.

**The transfer-then-depart pair can leave a partial result** → Stated above: the partial state is legible and repairable, and the ordering makes the dangerous half impossible.

## Migration Plan

No schema change, no data migration, no configuration. The backend addition is additive; the frontend replaces a placeholder route. Rollback is reverting the commit.
