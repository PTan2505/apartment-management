## Why

The previous change started collecting deposits and gave them no way out. A deposit is charged on the move-in invoice, excluded from revenue, and then disappears: nothing records that the owner is holding it, nothing returns it, and nothing reports how much of the money in the owner's hands is not theirs.

Two consequences are already waiting:

- **A renewal charges the deposit twice.** Staying on requires a new lease, and a new lease issues a move-in invoice charging a deposit — while the tenant's original deposit is still held. The first tenant to renew is billed for a deposit they already paid.
- **The last month's bill has no way to be settled from the deposit.** What actually happens at a move-out is that the owner deducts the unpaid final bill from the deposit and returns the rest. The system can record neither half: payment methods are `cash` and `bank_transfer`, and there is no refund at all.

## What Changes

**A deposit becomes a tracked holding**

- Record what a lease is **actually holding**, in currency, distinct from what its terms agreed. The two differ the moment a deposit is carried over from a previous tenancy or the tenant has not yet paid the move-in invoice.
- A deposit becomes held when the move-in invoice charging it is paid, not when it is billed. An owner who has not been paid is not holding anything.
- Report the shortfall or surplus against what the lease's terms require, so a carried-over deposit that no longer covers a raised rent is visible rather than silently short.

**Renewal carries the deposit instead of recharging it**

- **Add `POST /leases/:id/extend`**: close the current lease at its agreed end date and open a successor beginning the same day, carrying the deposit across. The tenant, the occupants, and the kinds of service fee carry too — the fees at the building's current prices, since a renewal is where a price rise takes effect.
- **A late extension is normalised to the on-time case.** Where the owner records the renewal after the agreed end date has passed, the previous lease still closes on its agreed end date and the successor still begins there. Those days belong to the new tenancy, not to an overdue bill: the parties renewed, so nothing was ever overdue.
- Settle the difference between the deposit carried and the deposit now required either as a line on the successor's move-in invoice, or in cash recorded separately — the owner's choice, in both directions.

**A deposit can be returned, and spent on what is owed**

- **Add `POST /leases/:id/deposit-refund`**: record what was returned to the tenant and why it differs from what was held. The system reports the arithmetic — held, already deducted, remaining — and does not decide the final figure. Damage to a room is not something it can know.
- **Add a `deposit_deduction` payment method**, so an unpaid final or overdue bill can be settled out of the deposit. The bill is genuinely collected — that money reached the owner months ago — while the holding shrinks by the same amount.
- **Add `POST /leases/:id/deposit-adjustment`**: record a top-up collected or an amount handed back outside any invoice.

**Deposits are reported as a holding, not as earnings**

- **Add `GET /deposits`**: what is currently held, per lease and in total, filtered by building. Deliberately not part of the revenue report — every figure there is a flow through a month, and a holding is a balance at a moment. Placing one in the other would invite "deposits held in March" to be read as something that happened in March.
- A refund SHALL NOT appear as an expense and SHALL NOT reduce net profit. Returning money that was never earned is not a cost.

## Capabilities

### New Capabilities

- `deposit`: what a lease holds, how it comes to hold it, how it moves to a successor, how it is spent on what is owed, how it is returned, and how it is reported — as a holding rather than as revenue.

### Modified Capabilities

- `lease`: a lease records the deposit it holds alongside the deposit its terms agreed; extending a lease closes it and opens a successor carrying that holding.
- `invoice`: an invoice may be settled by deduction from the deposit.

## Impact

**Database.** `Lease` gains the currency it holds and the record of how that holding was settled. `PaymentMethod` gains a value.

**Code.** A new module for the holding and its reporting. Lease extension is a new operation composing the existing move-out and creation paths. Recording payment of an invoice gains a branch that moves a holding.

**Behaviour that changes.** Marking a move-in invoice paid now also establishes a holding. Nothing already recorded moves: existing deposits were charged and paid before this change and are picked up by a backfill, stated as its own task rather than assumed.

**Out of scope.** Partial payment of an invoice; the deposit is settled per whole invoice as everything else is. Tenant-facing access to any of this — the tenant portal is a later change. Interest on deposits, which this business does not pay.

**Downstream.** The payment-records change that follows moves invoice payment into its own entity; the `deposit_deduction` method introduced here is one of the cases it must carry across.
