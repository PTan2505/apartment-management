## Context

Seven actions send their request on the click that names them. The rest of the application already confirms — retiring, withdrawing, cancelling, removing a cost, departing an occupant, transferring the primary tenant, deleting a signed contract — each with a dialog written by hand for that one action.

So the rule already exists in practice. What is missing is a statement of it and a shared way to ask, which is why each button added since was decided on its own.

Where things stand:

| Action | Today |
| --- | --- |
| Retire building / room, withdraw invoice, cancel tenancy, remove cost, depart occupant, transfer primary, delete contract scan | own dialog, confirmed |
| Reverse a payment | sends on click |
| Remove ID-card photo (×2), remove contract template | sends on click |
| Replace ID-card photo, contract scan, contract template | sends on click; the file it replaces is deleted |
| Restore building, restore room | sends on click |
| Save building / room / cost / tenancy-terms form | sends on click, money included |

## Goals / Non-Goals

**Goals.** One rule, one dialog, applied to every action that cannot be taken back. Money changes in forms surfaced as `old → new` before they are sent.

**Non-Goals.** No API change — the requests are identical, only later. No undo. No confirmation on creating things, on the vacancy run's per-row save, or on editing details that carry no money.

## Decisions

### What gets confirmed, and what deliberately does not

Confirmed: money moved, a file deleted or overwritten, in-service changed, a recorded price or amount changed.

Not confirmed: creating anything, recording a meter reading, editing a customer's name or phone, changing a tenancy's occupant count, saving a form in which no money changed.

The line is not "does it write" but "can the owner put it back from this screen". A created record can be edited or retired; a reversed payment and a deleted photo cannot be un-done at all.

A confirmation on every save would be worse than none: an owner who meets the same dialog fifteen times an hour stops reading it, and then it is not protecting the one case that mattered. Confirmations are spent where the damage is.

### The Save button is not a confirmation, for money

A form dialog's Save is already deliberate — which is why forms that change no money keep sending directly. But a form is filled in over a minute or two, fields are tabbed through, and a rate that was changed at the start is off-screen by the time Save is reached. The confirmation is not asking "did you mean to press Save"; it is showing the owner the four characters that changed, which the form no longer does.

This is also why the confirmation lists only the figures that actually changed: a list of everything on the form is a list nobody reads.

### One dialog component

`components/ConfirmDialog.tsx`: a title that asks the question, a body describing the consequence, a cancel and a confirm whose label names the action (`Hoàn tiền`, `Xoá`, `Khôi phục`), a colour for destructive ones, a busy state that disables both, and a slot for an error so a refusal is reported inside the dialog rather than behind it.

The existing hand-written dialogs that already confirm are NOT rewritten in this change. They work, several carry real content — a deposit settlement, a closing meter reading — and swapping them for a generic shell would be a large diff with no behavioural gain. New confirmations use the component; the old ones are left alone.

### Money changes, computed not remembered

`components/ChangedAmounts.tsx` takes a list of `{ label, before, after }` and renders only the entries that differ, each formatted with the same money formatter the rest of the application uses.

Each form already has its defaults — what the record held when it opened — and the submitted values. The diff is computed from those two at submit time. Nothing new is stored, and a form that is opened and saved with no edits produces an empty list and therefore no confirmation.

Comparison is numeric, not textual: `5000` and `5.000` are the same rate, and a formatted string would report a change that did not happen.

### Where the confirmation sits in the flow

For a form: submit → compute the changed figures → if none, send as now; if any, hold the validated values and open the confirmation over the form. Confirming sends them; declining closes only the confirmation, leaving the form exactly as it was.

For replacing a file: the file must be chosen first, because the confirmation names it — but the confirmation comes before anything is sent, including before the upload is signed. The chosen file is held until the owner confirms, and the file input is cleared if they decline, so choosing the same file again still triggers a change event.

### One request, once

The confirm button is disabled while the request is in flight and says so. This is what the existing dialogs do, and it matters most here: the actions being guarded are exactly the ones where sending twice is not harmless.

## Risks / Trade-offs

**Confirmation fatigue.** Every dialog added makes the others slightly less effective. Mitigated by keeping the list short and by making each one say something the owner does not already know — an amount, a file name, what the new rate applies to. A dialog that only says "Bạn có chắc không?" is the version that gets dismissed unread.

**Restoring now asks, where the specs said it should not.** `web-rooms` and `web-buildings` both recorded that restoring is not confirmed, because it is not destructive and is immediately visible. That reasoning still holds on its own terms; it is being overruled by a request for one consistent rule about actions that change what the rest of the application offers. Worth revisiting if it proves annoying in daily use — it is two lines to drop.

**Extra clicks on the rates.** An owner adjusting rates across several buildings now confirms each. That is the cost of the one case where a mistyped rate reaches next month's invoices for every room in the building.
