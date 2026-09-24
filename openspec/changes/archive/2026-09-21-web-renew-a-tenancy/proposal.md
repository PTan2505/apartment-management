## Why

Renewing a tenancy exists in the API and nowhere else. `POST /leases/:id/extend` closes a tenancy on its agreed end date and opens a successor beginning that same day, carrying the occupants, the service fees at today's prices and the deposit — one operation, written together.

An owner cannot reach it. What they can reach is "Ghi nhận rời đi" followed by "Hợp đồng mới", which is a different thing wearing the same outcome: the occupants are re-entered by hand, the deposit is settled and then collected again, the service fees are re-chosen, the days between the two tenancies are a gap nobody meant, and the two agreements are left with no record that one followed the other — the link this system now stores is never written, because nothing told it a renewal happened.

So the most ordinary event in a rental — a tenant staying another year — is the one the screens do not have.

## What Changes

- A "Gia hạn hợp đồng" action on a running tenancy, beside the actions that already end one.
- A dialog that asks for what the renewal genuinely needs: the closing meter reading and the new term. It shows what the successor will inherit — start date, occupants, deposit, service fees at current prices — rather than asking for them again.
- The rent defaults to the room's CURRENT rent and can be changed, because a renewal is where a price rise takes effect. The deposit months and the number billed for default to the predecessor's.
- Where the deposit required changes because the rent did, the dialog says so and lets the owner charge the difference on the successor's first invoice or settle it in cash.
- What the operation will do is stated before it is confirmed: the predecessor closes on its agreed end date with a final bill for its last month, and the successor opens with its move-in bill.
- Afterwards the owner lands on the successor, which already names the tenancy it renewed.

## Capabilities

### Modified Capabilities

- `web-leases`: the owner can renew a running tenancy from its screen.

## Impact

- `frontend` only: a new dialog, an action on the tenancy screen, an API call and a hook. No backend change — the endpoint exists, is specified, and is unchanged.
- New Vietnamese strings, reported for review rather than chosen silently.
