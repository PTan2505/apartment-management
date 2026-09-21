## Why

The number of people a tenancy is billed water for is shown on the occupants card under "Tính tiền cho", and the only way to change it is "Chỉnh sửa hợp đồng" at the top of the page — a dialog that opens on the duration and now carries six fields. An owner who has just read the count and knows it is wrong has to leave the place they read it, find the right field among the terms, and trust that they changed the number they were looking at.

The count stays manual and separate from the list of people, as `api-lease-management` decided and the specs require. This change does not touch how it is used — only where it can be corrected.

## What Changes

- An edit button beside the "Tính tiền cho" figure on a running tenancy.
- It opens a dialog holding that one number and nothing else, and saves through the existing lease update.
- The button is absent where the API would refuse the edit: a tenancy that has ended or was cancelled.
- The existing field in "Chỉnh sửa hợp đồng" stays. Two ways to reach one value, both writing the same field.

## Deliberately not changed

**How water is charged.** Still `building water rate × this count`, snapshotted onto each invoice at issue. Adding or recording the departure of a person still does not change the count.

**Other Vietnamese strings.** Only the three that described this count as used for electricity are changed, on the owner's instruction — see design.md.

## Capabilities

### Modified Capabilities

- `web-leases`: the billed count can be corrected from where it is shown.

## Impact

- `frontend/src/features/leases/` — the occupants card, a small dialog, and a one-field schema.
- No backend change: `PATCH /leases/:id` already accepts `occupantCount` on its own.
