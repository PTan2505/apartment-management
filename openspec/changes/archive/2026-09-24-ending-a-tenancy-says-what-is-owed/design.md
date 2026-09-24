## Context

The three endings are three dialogs, each with its own form, each acting on the
click of its own submit button. The amount owed is already computed on the
tenancy screen by `LeaseInvoicesPanel`, from the tenancy's invoices: not
withdrawn, not paid.

## Goals / Non-Goals

- Goal: the money still owed is in front of the owner at the moment of the
  decision, not one panel away.
- Goal: none of the three turns on a single click.
- Non-Goal: refusing the action. The API does not refuse it, and a screen that
  did would leave a room held by a tenancy nobody lives in.
- Non-Goal: a new API field. The invoices are already reachable by tenancy.

## Decisions

### One rule for "owed", written once

`LeaseInvoicesPanel` filters `voidedAt === null && paymentStatus !== 'paid'`.
That predicate moves into the invoices feature and both use it, so the panel's
"Dư nợ" and the dialogs' warning cannot disagree about the same tenancy — which
would be worse than either figure alone.

### The warning is a component, not three copies

One `UnpaidInvoicesWarning`, given a lease id, fetching the tenancy's invoices
the same way the panel does. Three copies of the same sentence drift apart the
first time one of them is edited.

It renders nothing when nothing is owed, and nothing while loading: a warning
that flickers in after the owner has read the dialog is a warning they will
not see.

### Confirmation sits on top of the form, not instead of it

Each dialog keeps its form. Submitting opens a `ConfirmDialog` that names the
tenancy and what will happen, and the request is sent from there. Declining
returns to the form with everything still filled in — the same pattern the
money-touching edit forms already use.

## Risks / Trade-offs

- **One more click on every ending.** Accepted deliberately: these are the
  three irreversible actions on the screen, and they are rare.
- **Two dialogs stacked.** MUI handles it, and the pattern already exists on
  this screen for edits that move money.
