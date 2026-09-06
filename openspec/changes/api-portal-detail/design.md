## Context

See proposal.md — Why.

`backend/src/modules/tenant-portal/` resolves a token to a customer, gathers their leases' invoices, and maps them into a portal-specific shape. The mapper is deliberate about withholding: the portal's shape is not the owner's invoice with fields removed, it is its own type carrying a single fact each, so it cannot accidentally tell a tenant something about the tenancy that is not theirs to see.

Payment is `POST /portal/invoices/:id/pay`, which creates a `Payment` row and returns the gateway's account, amount, reference and QR.

## Goals / Non-Goals

Reporting the building, a contact, a due date, a settlement date, and transfer details that can be read without writing. Not: a freshness timestamp, a reconciliation period, or expiring portal links — each named in the proposal with its reason.

## Decisions

### The due date is an invoice concept, not a portal one

This is the decision that shapes the change. The portal wants a due date; so does the owner's invoice list, which has wanted one since the billing-run redesign. Adding it to the portal's mapper alone would put the rule "when is this due" in the portal, and the owner's screens would later grow a second one.

So the field goes on the invoice, set when the invoice is issued, and the portal reports what it finds. The portal change depends on that and should not pretend otherwise.

**Where the date comes from is the open part.** A lease has a payment day in `api-lease-agreement-terms`, unrecorded on existing tenancies; deriving a due date from a day nobody agreed would manufacture an obligation. So: the field is nullable, the portal reports absence as absence, and how it is populated for new invoices is settled when the lease term it depends on exists.

### Reading transfer details is a GET, and it does not touch the gateway

The tempting implementation is to call the gateway in read mode. It is wrong twice: the gateway's link-creation is what mints a reference, so "reading" it either creates something anyway or returns something different from what paying will use — and a tenant who reads one account and is later shown another has been told two things.

The details that do not depend on the gateway — the account the owner receives to, the amount, and a reference derived from the room and period — are the ones a tenant typing a transfer by hand needs. The QR and checkout URL stay with the act of paying, because they are the gateway's and are created with the payment.

That splits the concept honestly: **where to send money** is a fact about the owner and the bill, and can be read. **A payment link** is a thing that gets created.

### The contact is the owner, reported per bill rather than per portal

A tenant may hold tenancies from different owners in a multi-owner deployment. Reporting one contact for the whole portal would be correct today, when there is one owner, and quietly wrong the first time there are two. Per bill costs nothing now and does not need revisiting.

### The settlement date comes from the payment, not from a new column

An invoice already has payments, each with the date it was taken. The settlement date is the date of the payment that settled it — a fact already recorded, and reading it is cheaper and truer than storing a copy that can disagree with the payments beneath it.

## Risks / Trade-offs

- **A readable transfer reference and the gateway's reference could differ.** That is the failure that matters: a tenant transferring with the wrong reference is a payment nobody can reconcile. → The reference read here must be the one the reconciliation actually matches on, or it must not be shown. Settling that is the first task, not an implementation detail.
- **A due date depends on a lease term that does not exist yet.** → Nullable, absent reported as absent, and the portal spec already requires it not be derived. The change is useful without it: building, contact and settlement date do not depend on it.
- **Exposing an owner's phone number to anyone holding a portal link.** It is already what the owner writes on a paper notice, and the link is a tenant's. → Worth stating rather than assuming; if the owner wants a different number shown to tenants than the one they sign in with, that is a field, not an accident.

## Migration Plan

A nullable due date on invoices; everything else is derived from what is already stored. Existing invoices report no due date, which the portal is required to render as absence.

## Open Questions

- Which reference the payment reconciliation matches on, and therefore what a tenant may safely be shown to type. This changes what gets built and must be answered before task 2, not deferred past it.
