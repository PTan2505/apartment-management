## Context

`POST /leases/:id/extend` takes a closing meter reading and a term, with the rent, the deposit months, the number billed for and a deposit-settlement flag all optional. It closes the predecessor exactly as a move-out does — final invoice for the last month, occupancy records closed — opens the successor on that same day, carries the occupants with their primary, carries the service fee KINDS at the building's current prices, and returns both tenancies. The link between them is recorded.

None of that is reachable from a screen. The tenancy page offers "Chỉnh sửa hợp đồng", "Thêm người", "Ghi nhận rời đi", "Tải ảnh lên" and "Huỷ hợp đồng".

## Goals / Non-Goals

**Goals.** One action, one dialog, and no second data entry for anything the successor inherits.

**Non-Goals.** No change to the endpoint, no renewal from the list screen, no batch renewal, no reminder that a term is ending — that belongs to whatever surfaces expiring tenancies.

## Decisions

### Modelled on the move-out dialog, not on the signing form

A renewal closes a tenancy, so it asks what a closing asks: the meter reading. It opens one, so it asks the single thing an opening cannot infer: how long. Everything else the API defaults, and those defaults are correct — the room's current rent, the predecessor's deposit months and occupant count.

The signing form asks twelve questions because a new tenancy has no predecessor to inherit from. Reusing it here would ask the owner to retype what the system is about to copy anyway, and every retyped field is a chance to disagree with what is carried.

### What is inherited is shown, not editable

Start date, occupants, service fees: displayed as facts of the operation. Making them editable would mean either sending values the endpoint does not accept, or quietly dropping them — and a field that can be changed but is ignored is worse than no field.

The rent is the exception, because the API accepts it and because the renewal is the moment a rise applies. It is filled from the room's current rent rather than the predecessor's, which is what the API would do anyway; showing the figure makes a rise visible at the moment it takes effect instead of arriving on a bill later.

### The deposit difference is a decision, so it is asked as one

`settleDepositOnInvoice` defaults to true in the API. Where the required deposit has not changed the flag is invisible and the dialog says nothing about it. Where it has, the dialog names the difference and offers both answers — charge it on the first invoice, or leave it as a shortfall the owner settles in cash. A default that silently adds money to a tenant's first bill is exactly the kind of decision this project confirms rather than assumes.

### Two invoices are named before the click

A renewal issues the predecessor's final bill and the successor's move-in bill. Both are money the owner has to explain to a tenant. The dialog says so in the sentence above the confirm button, for the same reason the cancellation dialog names what happens to the deposit.

## Risks / Trade-offs

**The dialog is read-only about things owners may want to change.** An owner renewing with a different occupant count has to renew and then edit the terms. Accepted for now: the endpoint takes `occupantCount`, so adding the field later is small, and guessing which fields matter before anyone has used the action would be inventing requirements.

**A renewal cannot be undone from the screen.** Neither can a move-out; both are recorded operations with invoices attached. The confirmation and the stated consequences are what stands between a mis-click and a closed tenancy.
