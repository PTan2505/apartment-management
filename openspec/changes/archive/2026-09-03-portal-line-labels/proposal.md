## Why

The tenant portal is Vietnamese apart from the one thing a tenant opens it to read. Each charge shows a Vietnamese heading for its kind and, beneath it, the description the backend stored:

```
Tiền nhà
Rent 2026-08 · 01/08/2026 – 31/08/2026
```

That second line is English, and it is the line carrying the detail. The owner's screens were given Vietnamese labels for exactly these charges in the previous change; the portal reads the same data and did not get them.

It is also the more exposed of the two surfaces. The owner is one person who will learn what an English word means; a tenant is anybody, arriving from a link on their phone to check a bill they were sent.

The labels already exist and already handle every case — including the one where the text belongs to the owner and must not be touched. They just live in a feature folder the portal should not be importing from.

## What Changes

- **The charge labelling moves to a shared place** and both surfaces use it. One implementation, so the two cannot describe the same charge differently.
- **The portal names each charge fully** rather than showing its kind above an English description. `Tiền nhà tháng 8/2026` says more than `Tiền nhà` over `Rent 2026-08`, and says it in one line instead of two.
- **A charge the owner wrote is shown as the charge itself.** Today a broken window reads as *Khoản phát sinh* with the owner's sentence demoted to a caption; the sentence is the informative part and becomes the heading.
- The quantity, rate, period and meter readings are untouched — they are numbers and dates, and already read correctly.

## Capabilities

### Modified Capabilities

- `web-tenant-portal`: a bill's charges are named in Vietnamese, using the same labelling the owner's screens use.

## Impact

- `frontend/src/lib/` — the labelling, moved here from the invoices feature so both surfaces can reach it.
- `frontend/src/features/invoices/` — imports it from its new home.
- `frontend/src/portal/InvoiceCard.tsx` — uses it.
- No backend change, no data change, no change to any figure.
