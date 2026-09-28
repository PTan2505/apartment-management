## Why

`api-staff-roles` drew the manager's line in one place: the revenue report. Everything
else that running a building involves was handed over, including four things the owner
has since said are theirs — what the property IS, what it COSTS, what an agreement SAYS
once signed, and whether money has arrived.

The line was drawn around *reading* earnings. It needs to be drawn around *setting the
numbers those earnings come from*, and around *declaring a debt settled*. A manager who
can retype a room's rent, sign a tenancy at a rent of their own, correct that tenancy
afterwards, and then mark its invoices paid, is not narrowed by being unable to open the
revenue report — they can move every figure the report adds up.

## What Changes

- **Rooms become the owner's**, as buildings already are. Creating, correcting, retiring
  and restoring a room are all refused to a manager; listing and retrieving are not.
  Creation is included because a room is created WITH its rent.
- **The prices on a new tenancy are read, not typed.** A manager signing a tenancy may
  not supply its base rent, electricity rate, water rate, or deposit months. Each is
  taken from the room and the building. Supplying one is refused outright rather than
  quietly ignored — a manager who typed a rent must not be told the tenancy was created
  and left to discover which rent it carries.
- The same four are refused on a **renewal**, which is where a price rise takes effect.
  Without this the restriction above is a formality: sign at the owner's rent, renew at
  your own.
- **A signed tenancy is not editable by a manager.** Correcting its terms is refused —
  including its occupant count, which is the same operation and decides the water bill.
- **Declaring money settled or unsettled is the owner's.** Recording a payment against
  an invoice, withdrawing an invoice, and reversing a recorded payment are all refused
  to a manager. Money arriving through the tenant's payment link is unaffected: nobody
  declares it, the gateway reports it.
- **A building gains a default number of deposit months**, because a tenancy's deposit
  now has to come from somewhere the owner set. Existing buildings take 1 month, which
  the owner can correct on the building screen.

Buildings already refuse a manager on create, update, retire and restore; that half of
the owner's first instruction needs no change, and this proposal records that it was
checked rather than assumed.

Deliberately NOT changed, and listed so the omissions are visible rather than accidental:
an ad-hoc invoice (a manager may still name charges the owner decides), a deposit refund
or adjustment, overdue charges at a move-out, and which of a building's service fees a
tenancy takes up. Each moves money and none was named; they are the owner's to call
next, not mine to assume.

## Capabilities

### New Capabilities

(None.)

### Modified Capabilities

- `staff`: the manager's powers are narrowed — rooms, the prices on a tenancy, editing a
  signed tenancy, and settling money all leave their remit. The role-to-power map lives
  in this capability, which is why the narrowing is written here rather than scattered
  through `room`, `invoice` and `payment`, whose own requirements are still phrased
  around the owner.
- `lease`: a tenancy's deposit months become optional and default to its building's.
- `building`: a building records the deposit months its tenancies default to.

## Impact

- Affected specs: `staff`, `lease`, `building`
- Affected code: `backend/prisma/schema.prisma` (+ migration adding
  `Building.defaultDepositMonths`), the routers for rooms, leases, invoices and payments,
  `backend/src/modules/leases/{schema,service}.ts`, and one new error code
- **BREAKING for API callers**: `depositMonths` stops being required on `POST /leases`.
  Nothing that sends it breaks; the frontend will stop sending it for a manager.
- The screens are not touched here. A manager would still be SHOWN buttons that now
  answer 403, which is worse than not having them — `web-manager-limits` follows and must
  ship with this.
