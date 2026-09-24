## Why

The tenancy screen says how long is left, in one weight and one colour, whether
the answer is nine months or four days. Nothing on it says how long a tenancy
has been past its term at all — once the term runs out the figure disappears,
because "còn 0 tháng" would be false, and the screen goes quiet about exactly
the tenancy the owner has to act on.

An owner opens this screen to decide whether to ring the tenant this week. That
decision is the difference between "Còn 5 ngày" and "Còn 5 tháng", and between
"ended" and "ended five weeks ago and the room is still being held".

## What Changes

- The remaining term on the tenancy screen is emphasised when the tenancy is
  within two weeks of its end, in the colour the state already uses in the list.
- A tenancy past its term says how long it has been past it — "Quá hạn 5 ngày" —
  instead of showing nothing.
- No new API field: both figures are arithmetic over dates the tenancy already
  reports, and the state that decides the emphasis is the one the API derives.

## Impact

- Affected specs: `web-leases`
- Affected code: `frontend/src/features/leases/dates.ts`,
  `frontend/src/features/leases/LeaseDetailPage.tsx`
