## Why

The portal is the one screen a tenant ever sees, opened on a phone from a link, usually because they are querying a number. It works and it is plain: a list of bills, each expanding into its charges.

What it does not do is make the current bill the thing you land on. Every bill reads at the same weight, so the one that is unpaid — the reason the link was opened — is found rather than shown. And the amount, the state, and the deadline are three separate readings instead of one glance.

The new design fixes that: the outstanding bill leads, in full, with what is owed stated once; settled bills collapse behind it and say what settled them.

## What Changes

- The most recent bill opens expanded, with the ones behind it collapsed. Today the list opens with everything collapsed, and a tenant with one unpaid bill taps to reach the thing they came for.
- An unpaid bill states what is owed as the figure it leads with, and says plainly that it is unpaid; a settled bill says so and stays out of the way.
- The charges get the design's typography: each with its own working beneath it — the meter readings and rate for electricity, the count and rate for a per-person charge — rather than as a caption of the same weight.
- The room and the person the bill is addressed to sit in a header, so a tenant with bills for two rooms can tell which is which.
- The transfer details keep their existing treatment and gain the design's, **still shown after the tenant asks to pay**.

## Deliberately not built

**The transfer block shown before the tenant asks.** The bank details exist only in the response to `POST /portal/invoices/:id/pay`, and that call CREATES a payment record. Rendering them on arrival would mean opening the page creates a payment for every unpaid bill — a behaviour change, and one that would fill the record with payments nobody started. The tenant presses, as today.

**"Liên kết truy cập chỉ có giá trị trong 7 ngày."** This system's portal token has no expiry: it lives for the length of the tenancy and dies when the owner revokes it or issues a replacement — a deliberate design, recorded in the schema, and the reason a JWT was rejected. Printing the sentence would tell a tenant something untrue about the link in their hand. The "link no longer valid" state stays, because revocation is real; it will not claim a deadline that does not exist.

**The "MINH HOẠ CÁC TRẠNG THÁI KHÁC" block.** That is the mockup showing its own empty and expired states side by side for review. Built literally it would put a permanent fake "no bills yet" card and a fake expiry warning underneath a working page.

**Six things the API does not report** — the building's name and address, a bill's due date, the date a paid bill was settled, a reconciliation period, a freshness timestamp, and the owner's support number. Named here and left out rather than invented. `api-portal-detail` carries them.

## Capabilities

### Modified Capabilities

- `web-tenant-portal`: the outstanding bill leads and states what is owed; the portal states only what the system knows about the link it was opened with.

## Impact

- `frontend/src/features/portal/PortalApp.tsx`, `InvoiceCard.tsx`, `PaymentPanel.tsx`.
- **No change to `api.ts`, to any request, or to any data shape.** No backend change.

## A note on the verification asked for

The request carried the same closing line as the previous three: filter by building, filter by month, click a row through to a detail. The portal has none of those — no filters, no table, and one screen. The checks that mean something here are: arriving with a valid link, a bill expanding to its charges, the charges summing to the stated total, pressing to pay and seeing the transfer details, and arriving with a revoked link. Those are what the tasks verify.
