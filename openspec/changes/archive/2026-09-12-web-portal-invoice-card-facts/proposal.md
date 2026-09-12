## Why

The tenant portal's bill card names the room and the issue date. The API also reports which building the room is in and, for a settled bill, the day the money landed. Neither reaches the screen.

Both absences show up in the same moment — a tenant checking whether a transfer went through. The card says "Đã trả" and nothing about when, so the only way to tell last month's settled bill from this month's is to open it. And a tenant renting in two buildings sees two rooms whose codes mean nothing to them side by side, because room codes repeat across buildings.

## What Changes

- The bill card names the building beside the room.
- A settled bill says the day it was settled.
- A settled bill whose payment carries no date says it is settled without inventing a day for it.

## Deliberately not built

**A fallback date on a settled bill with no payment date.** The API deliberately reports null there — a bill written off, or settled against a deposit before dates were recorded. Substituting the issue date or today would put a date in front of a tenant that nothing in the system supports, on the one screen they use to check a transfer.

**The building on the detail rows inside the card.** It belongs to the bill, not to a charge, and repeating it per line would say otherwise.

## Capabilities

### Modified Capabilities

- `web-tenant-portal`: the bill card names the building and says when a settled bill was settled.

## Impact

- `frontend/src/features/portal/` — the invoice type and the card.
- No backend change: the tenant portal mapper already reports both.
