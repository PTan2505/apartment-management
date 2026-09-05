## Why

The billing screen is where the month actually gets closed, and it is the
plainest screen in the product: a table, a number field per row, a button per
row. It works, and it tells the owner almost nothing while they use it.

What it withholds is what they are in the middle of doing. Typing a closing
reading, the owner cannot see the consumption it implies — the very figure being
billed — without subtracting in their head from the column beside it. They
cannot see how far through the round they are without counting rows. And they
cannot see the rate that number is about to be multiplied by, which is the one
thing that turns "1620" into money.

The supplied design answers all three, and it does it while the owner is looking
at the row, not afterwards on the invoice.

## What Changes

**On the screen, from data already present:**

- A **Số điện dùng** column: the difference the row will actually bill,
  computed as the reading is typed.
- A **progress figure** — rooms entered out of rooms outstanding — and a total
  of the consumption entered so far.
- A **status per row**: entered, waiting, or in error, so the state of the round
  can be read down a column rather than inferred from which fields look filled.
- Readings carry their unit, and a row whose reading is invalid is tinted rather
  than only annotated.

**Two things that are not presentation, and are in scope deliberately:**

- **The API gains the electricity rate.** The design shows the rate the reading
  will be multiplied by; `GET /invoices/due` does not return it. The frontend
  will not be made to fetch each building separately to assemble it — that is
  a request per row for a figure the endpoint already has in hand.
- **Enter issues the row being typed.** The owner enters ten readings in a row
  from a sheet of paper. Reaching for the mouse between each one is the cost the
  design's keyboard hint is aimed at.

### Deliberately not followed

**The design replaces per-row issuing with one batch button, disabled until
every room is valid.** Not followed, and it would be a mistake to: a single room
whose meter could not be read would block billing every other room in the
building. `web-invoices` already states the opposite as a requirement — *the
application SHALL NOT require the whole list to be completed at once* — for the
reason the design overlooks, that an owner interrupted halfway has genuinely
billed the rooms they entered.

The visual language of the design's bottom bar — progress, and how much is left
— is worth having, and is kept. What is dropped is only its all-or-nothing gate.

**The name `AnGia Quản Lý` and the line "Hệ thống vận hành toà nhà".** Settled
when the navigation was redesigned; the product is `Quản lý trọ`.

**The breadcrumb and the "Kỳ ghi" chip.** Presentation of things the screen
already says in its heading and its month selector; adding a second place to
read them makes the screen busier without answering anything new.

## Capabilities

### Modified Capabilities

- `invoice`: the report of what is due to be billed gains the rate each
  tenancy's electricity will be charged at. It already carries the opening
  reading for the same reason — so a caller can present a figure to check
  against without asking a second question per row.
- `web-invoices`: the billing screen gains what it must show about work in
  progress, and confirmation from the keyboard.

## Impact

- `backend/src/modules/invoices/service.ts` and its mapper — the due list gains
  a field. Additive; no caller breaks.
- `frontend/src/features/invoices/types.ts`, `BillingRunPage.tsx`.
- No change to how an invoice is issued, what it charges, or when a row leaves
  the list.
