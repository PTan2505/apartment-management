## Why

`api-manager-limits` takes four powers off the manager. The screens do not know that.
Every control it removed is still drawn: a manager will click "Sửa", "Ngưng hoạt động",
"Ghi nhận thanh toán" and "Thu hồi hoá đơn", and get a red toast each time.

That is the worst version of a permission — the person cannot tell "you may not" from
"it is broken", and the only way to learn the boundary is to keep hitting it in front of
a tenant. The rules have to be visible before they are enforced.

## What Changes

- Controls a manager may not use are not drawn: editing, retiring and restoring a
  building or a room, adding a room, correcting a tenancy's terms or occupant count,
  recording a payment, withdrawing an invoice, reversing a payment. Where that empties a
  row's actions menu, the menu goes too rather than opening onto nothing.
- Nothing a manager may READ is hidden. A room still shows its rent, an invoice still
  shows what it owes. They work from those figures daily; they simply cannot move them.
- The tenancy form shows a manager the rent, both rates and the deposit it will be
  created with — filled from the room and the building, read-only, and labelled as the
  owner's. A manager is quoting those numbers to the person signing; hiding them would
  send them to another screen to read what they are about to agree to.
- The renewal dialog does the same for the rent and the deposit.
- The building form gains the default deposit months the API now records.
- One helper for "is the signed-in account the owner", so eleven screens do not each
  invent the test.

## Capabilities

### New Capabilities

(None.)

### Modified Capabilities

- `web-staff`: a control the signed-in role may not use is not shown, and a manager signs
  a tenancy on the owner's figures while still being able to read them.
- `web-buildings`: the building form captures the default deposit its tenancies take.

## Impact

- Affected specs: `web-staff`, `web-buildings`
- Affected code: a new role helper in `frontend/src/features/auth/`, the row actions and
  page headers of buildings and rooms, `LeaseFormDialog`, `ExtendLeaseDialog`,
  `EditTermsDialog` and `EditOccupantCountDialog`'s entry points, the invoice detail and
  list actions, and `BuildingFormDialog`
- Ships WITH `api-manager-limits`. On its own it hides controls the API still allows,
  which is harmless; the other way round is not.
