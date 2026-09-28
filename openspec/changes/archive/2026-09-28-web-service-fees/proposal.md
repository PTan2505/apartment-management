## Why

A building's service fees — rubbish, internet, a parking space — have had a complete API
since `api-billing-operations`, and no screen at any point. The rows could be created
only with `curl`. Attaching one to a tenancy had no screen either, which is the half that
reaches money: a fee charges nobody until a tenancy takes it up.

So the feature existed and did nothing. The owner could not add a fee, and if a fee
somehow existed they could not put it on a tenancy, and so no invoice ever carried one.

The catalogue had also been standing in for something it is not. The only entry in it was
"Phí ở quá hạn", used to name a charge for days beyond a term — which is a lump sum typed
by hand, not a monthly fee. Service fees are the monthly kind; overdue charging is its
own question and is left alone here.

## What Changes

- **A building's page manages its catalogue.** Add a fee, rename or reprice it, retire one
  and bring it back. Owner only — a manager reads it and changes nothing, by the rule
  `web-manager-limits` set.
- **A tenancy's page manages what it took up.** Attach a fee from the building's
  catalogue with a quantity and a start date, change the quantity, and stop it. Available
  to a manager as well as the owner: the price comes from the catalogue, so attaching one
  sets no price.
- Each screen says what the other does, because the split is not obvious: setting a fee
  on a building charges nobody, and a tenancy is where it starts costing money.
- A tenancy shows what its fees add to every month, and an attached fee whose catalogue
  entry has since been retired says so — it keeps being charged, because a tenancy holds
  its own copy of the price.
- `BuildingServiceFee` moves from `features/leases` to `features/buildings`, where the
  catalogue belongs. It lived with tenancies only because a move-out dialog was the first
  screen that needed to read it.

## Capabilities

### New Capabilities

(None.)

### Modified Capabilities

- `web-buildings`: a building's page manages the fees it charges beside rent.
- `web-leases`: a tenancy's page manages the fees it is billed for, and says what they
  add each month.

## Impact

- Affected specs: `web-buildings`, `web-leases`
- Affected code: new `ServiceFeesCard` and `ServiceFeeFormDialog` under
  `features/buildings`, new `LeaseServiceFeesCard` under `features/leases`, the api and
  hooks of both features, and the two detail pages
- No API change, and no schema change. Every endpoint already existed and is already
  role-guarded; what was missing was entirely screens.
