## Why

Every charge this system can make is one it can calculate: rent from the agreed rent and the days, electricity from two readings, water from a head count, a service fee from a catalogue price, a deposit from a number of months. There is exactly one exception — the overdue invoice, where the owner names the amount because no agreement covers those days.

Real tenancies produce that second kind of charge constantly, and only one of them can be recorded:

```
  lost key            owner decides      no way to charge it
  cleaning a room     owner decides      no way to charge it
  breaking a window   owner decides      no way to charge it
  breach penalty      owner decides      no way to charge it
  late payment        owner decides      no way to charge it
  days past the term  owner decides      overdue invoice
```

The gap has an immediate consequence, introduced by the change that just landed. An owner returning a deposit may return less than they hold — keeping 200,000 against a broken window — and that 200,000 goes nowhere. It is not revenue, not an expense, not a holding. It leaves the books entirely, and the report shows an owner who earned less than they did.

Recording the repair as an expense does not fix it: that reports a 200,000 loss on a window the tenant paid for.

## What Changes

**A charge the owner decides**

- **Add an ad-hoc invoice**, issuable against a lease at any time, carrying charges the owner names and prices. Unlike every other kind, a lease may have as many as it needs — a lost key in March and a broken window in July are two events, not one.
- Each charge SHALL carry a **category** from a fixed set — damage, cleaning, a lost item, a penalty, other — alongside a free description. The categories mirror the expense categories deliberately: `damage` is what `repair` costs. Free text alone cannot be grouped; the building's service fee catalogue is the wrong home, because a broken window is not a service the building offers and putting it there would let a tenant subscribe to one monthly.
- Such a charge **is revenue**. It is the one thing that distinguishes it from a deposit line, which is the only kind of charge this system excludes.
- An ad-hoc invoice is paid like any other: in cash, by transfer, or by deduction from the deposit — which is what an owner actually does at a departure.

**Keeping money becomes impossible without recording why**

- **BREAKING**: returning a deposit no longer takes an amount. A return hands back the whole holding. Keeping any part of it requires charging for that part first, on an ad-hoc invoice settled from the deposit.
- This is the point of the change rather than a side effect. Adding a correct route beside an incorrect one leaves the incorrect one available; removing the amount closes it. The free-text reason on a return goes with it — a reason belongs on the charge that took the money, where it carries a category and an amount.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `invoice`: an ad-hoc invoice exists, carrying charges the owner names, prices and categorises; a lease may have many.
- `deposit`: returning a deposit returns all of it; keeping any part requires a charge.
- `revenue-report`: an owner-named charge is revenue, and is reported by category.

## Impact

**Database.** `InvoiceType` gains a value, `InvoiceLineKind` gains a value, and a line gains a nullable charge category. No existing row changes meaning.

**Code.** A new issuing path for ad-hoc invoices. The deposit return loses a parameter and a column. The revenue report gains a breakdown it did not have.

**Behaviour that changes.** `POST /leases/:id/deposit-refund` stops accepting an amount and a note. Nothing calls it yet — no frontend exists — so nothing breaks, but the endpoint shipped this week and the change is deliberate rather than incidental.

**Out of scope.** Retiring the overdue invoice into this one. It is the same shape and arguably a special case, but it works, it is verified, and folding it in would move money for no gain. Recording an ad-hoc charge against anything other than a lease — a building, a room standing empty — which has no owner asking for it.

**Downstream.** The payment-records change carries one more invoice kind across; the tenant portal will show these to the tenant like any other bill.
