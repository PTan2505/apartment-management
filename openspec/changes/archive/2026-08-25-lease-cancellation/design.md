## Context

See proposal.md — Why, for the defect and how it was reproduced. What shapes the approach:

- Occupancy is derived from `moveOutDate IS NULL`, in more than one place: the room's `isLet`, the `vacant` filter, the guard refusing a second lease on a room, and the guard refusing to retire an occupied room.
- Deposits become a holding (`Lease.depositHeld`) only when the invoice charging them is **paid**. An unpaid move-in invoice means no holding exists.
- A paid invoice cannot be voided. The system refuses, saying voiding it would leave the money paid for it unaccounted for.
- Deposit lines are excluded from revenue everywhere, deliberately and with the reason stated in the code. `charge` lines are revenue.
- `deposit_deduction` already exists as a payment method: a bill settled out of money already held.

## Goals / Non-Goals

**Goals:**

- Free the room. Everything else is bookkeeping around that.
- Record what the owner decided about the money, without inventing an accounting rule the owner did not apply.
- Make a cancelled tenancy unmistakable from one that ran, everywhere it is read.

**Non-Goals:**

- Unwinding a tenancy that has been billed. That is a larger problem — issued invoices, possibly paid, possibly with meter readings — and the guard here exists so it is not attempted by accident.
- Reversing a gateway payment. What the tenant gets back is handed over outside this system; the record says how much, not by what means.
- Extending, moving out, or returning a deposit at the end of a tenancy that ran.

## Decisions

**A stored `cancelledAt`, with status derived from it.**

Status is already derived rather than stored, and that is what keeps it from contradicting the rows it comes from. Adding a third state as a stored enum would break that: a lease could then be marked cancelled while holding a move-out date. `cancelledAt` alongside `moveOutDate` keeps the same property — two dates, and a status computed from which of them is set.

`cancelledAt` also answers a question no other column can: **when** the owner gave up. Recording only a boolean would leave a cancelled tenancy unplaceable in time, and the month it falls in is what the kept revenue is attributed to.

**Occupancy becomes "no move-out AND not cancelled", changed everywhere at once.**

This is the highest-risk part of the change, and the risk is not that it is hard but that it is scattered. `moveOutDate: null` appears as the occupancy test in the room's select, the vacancy filter, the create-lease guard, and the retire guard. Miss one and the symptom is a room held by a tenancy that no longer exists — the exact defect this change exists to remove, reintroduced in a corner.

Found while implementing, and missing from the four: **the database enforces the same rule independently**, in the partial unique index behind one-active-lease-per-room, whose predicate was `moveOutDate IS NULL`. A cancelled lease has no move-out date, so it kept holding the room's single active slot in the database even once every service guard had been taught to ignore it — re-letting the room would have failed on a constraint violation rather than on any rule anybody wrote. The index is redefined in the migration to match. It is a fifth copy of the predicate, and the one that cannot be expressed in the shared definition the other four now reference.

Those four are collapsed into a single exported predicate rather than edited in place. The risk being managed is duplication, and four copies corrected in unison are still four copies; adding a third way for a tenancy to end should mean editing one file.

The overlap check is separate and needs the opposite treatment: cancelled leases are excluded from it entirely rather than having their dates compared, because a tenancy that covered no days cannot be overlapped.

**What is kept is recorded as an ad-hoc invoice settled by deposit deduction.**

The alternative is a new kind of record for retained deposits, with the revenue report taught to read it. That means a second path into revenue, and two paths into a total is how a total stops adding up.

The existing machinery already fits: an ad-hoc invoice carries owner-named `charge` lines, which the revenue report counts as revenue with no exception needed; `deposit_deduction` settles a bill from money already held, which is exactly what happens here — the money reached the owner months ago and is only now becoming theirs. Nothing new is taught to the report, and the kept amount is legible afterwards as a bill against that tenancy rather than as an unexplained sum.

The returned amount needs no such record. It is the tenant's money going back, and the system already treats deposit movements as changing whose hands money is in rather than as earning or spending.

**One figure to settle, not one per charge.**

A paid move-in invoice covers a deposit and the first month's rent, and it would be possible to ask about each. It would also be fiction: the owner took one payment, will hand back one amount, and did not decide "I am keeping the rent but returning the deposit". Asking them to apportion it invents a distinction they cannot act on.

The settlement is therefore against the holding as a whole — which is also the only figure that is actually reliable, since a partly-paid or adjusted holding may not match the invoice's lines anyway.

**An unpaid move-in invoice is voided rather than left outstanding.**

It bills a tenancy that never happened. Leaving it counts a debt nobody owes in every report from now on. Voiding is already the operation for an invoice that should not have been issued, and it is permitted precisely because nothing was paid against it.

## Risks / Trade-offs

**An occupancy test missed somewhere leaves a room held by a cancelled tenancy** → The tests are enumerated above and each is checked explicitly during verification, including the retire guard, which no screen exercises and which would otherwise be found by an owner months later.

**A cancelled lease still has occupant records and a move-in invoice** → Intended. They are the record of what was agreed and then abandoned; deleting them would leave a cancellation that cannot be explained afterwards.

**An owner could cancel instead of recording a move-out, losing a month's billing** → The monthly-invoice guard blocks the case where billing has begun. Before that point the two operations describe genuinely different events, and the screen names which is which rather than relying on the owner to infer it.

**The kept amount appears as an invoice, which an owner may not expect** → It is a bill against the tenancy, which is what it is: money owed to the owner and settled from what they held. The alternative — revenue with no document behind it — is worse to audit.

## Migration Plan

One additive column, nullable, with no backfill: every existing lease is either running or finalized, and `cancelledAt` being null says so correctly. Deployed as an ordinary change; rollback is reverting the commit, since nothing reads the column before this change and nothing depends on it afterwards except the derived status.
