## Context

See proposal.md — Why. What shapes the approach:

- Voiding already exists end to end: the endpoint, the refusal on a paid invoice, the retention of the voided record, and its exclusion from every total. None of that is being revisited.
- The correction loop is already wired and verified: a voided invoice frees its lease/month slot, and the tenancy reappears on that month's billing list, opening from the same reading. Nothing new is needed to make reissuing work.
- Cancelling a tenancy already voids its unpaid move-in invoice, in a transaction, without an owner naming a reason.
- Production and local databases hold invoices voided before this change. Nobody knows why they were withdrawn.

## Goals / Non-Goals

**Goals:**

- Make a wrong bill correctable from the application, by the person who issued it.
- Leave a withdrawn bill explainable months later.
- Finish the correction rather than starting it.

**Non-Goals:**

- Editing an invoice in place. An issued bill is a record of what was charged.
- A second path into issuing invoices. Reissuing goes through the billing list like every other monthly invoice.
- Bulk voiding.

## Decisions

**The reason column is nullable, and not backfilled.**

Requiring a reason on the way in does not require every existing row to have one. The invoices already voided were withdrawn for reasons nobody recorded and nobody now knows, and a NOT NULL column forces a backfill — which means writing something like "Reason not recorded" into rows as though it were a fact somebody stated.

Nullable, read as "voided before reasons were recorded", is true. The requirement is enforced by the service on the way in, where it can be, rather than by the column, where it would cost a lie.

**The system's own void records a reason in the same column.**

Cancelling a tenancy voids its unpaid move-in invoice. That withdrawal needs explaining exactly as much as an owner's does — more, since nobody performed it deliberately — and it has a reason that can be stated precisely: the tenancy was cancelled.

The alternative is a separate marker for system-performed voids, which means two places recording why a bill was withdrawn and a reader having to check both. One column, filled by whoever withdrew the bill.

**A free-text reason, not a fixed list.**

The mistakes are genuinely varied: a misread meter, a bill against the wrong tenancy, a charge waived after a conversation with a tenant, a duplicate issued by accident. A fixed list is either too short to cover them — in which case "other" absorbs everything and the field stops meaning anything — or long enough that choosing from it takes longer than typing.

This is the opposite of the ad-hoc charge categories, deliberately. Those are categorised because they are compared and totalled across tenancies; a void reason is read once, by a person, about one bill.

**Reissuing goes through the billing list, not through a combined dialog.**

Void-and-reissue in one dialog is fewer steps and creates a second way into issuing a monthly invoice, parallel to the billing screen. Two paths into issuing means two places where the meter reading, the month and the refusals are handled, and they will not stay identical.

The correction loop already works: the tenancy reappears on that month's list, opening from the same reading. What is added is a sentence saying so and a link — the cheapest possible thing that finishes the task.

**The action is withheld on a paid invoice, with the prior step named.**

The API refuses it, and the screen already knows the invoice is paid. Offering the action to report a refusal teaches the owner nothing they can act on; naming the reversal — which is on the same screen — is the thing they actually need.

## Risks / Trade-offs

**An owner withdraws a bill and never reissues it** → The tenancy stays on that month's billing list, which is the screen that exists to show exactly this: what has not been billed yet. The month is not reported as closed until it is.

**A free-text reason gets filled with a keystroke** → Real, and not fully preventable. Requiring it is what can be done from here; a minimum length would be gamed by the same keystroke repeated.

**Voiding a move-in invoice leaves no route to reissue it** → True, and stated rather than hidden: no billing list covers a move-in invoice. Reissuing one is not possible today from any screen, and this change does not pretend otherwise.

## Migration Plan

One additive nullable column, no backfill. Deployed as an ordinary change; rollback is reverting the commit, since nothing reads the column before this change and nothing depends on it afterwards.
