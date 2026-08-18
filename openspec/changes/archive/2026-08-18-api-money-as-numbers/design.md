## Context

Thirteen `Decimal` columns across `Building`, `Room`, `Lease`, `Invoice`, and `Expense`, plus the revenue report's computed aggregates, all reach the client as JSON strings. Services select them and hand them to `res.json()`; nothing converts them.

`web-foundation` compensated on the frontend with `toMoney` / `mapMoneyFields`, applied per named field. That code works, but it makes every future domain change responsible for remembering which of its fields are monetary.

See proposal.md for motivation, including why an Express `json replacer` cannot do this and why numbers are lossless for these columns.

## Goals / Non-Goals

**Goals:**
- Make the correct representation the default, so no caller and no future change has to opt in.
- Change one file. A fix that required touching thirteen call sites would have the same forget-one failure mode it is meant to remove.

**Non-Goals:**
- No change to how amounts are calculated or rounded. This is transport only.
- No general-purpose serialisation layer. There is one type with one wrong default.
- No conversion of other digit-bearing values. Phone numbers and room codes stay text.

## Decisions

### Override `Decimal.prototype.toJSON`, in the Prisma client module

`Decimal` already decides how it serialises — it just decides wrongly for this application. Changing that decision is one assignment, and it applies everywhere a `Decimal` is serialised, including values the query layer computes and returns without a service ever naming them.

```
  before                              after
  ──────                              ─────
  Decimal("3000000").toJSON()         Decimal("3000000").toJSON()
    → "3000000"   (string)              → 3000000     (number)

  {"totalAmount":"3450000",           {"totalAmount":3450000,
   "electricityRate":"3500.5"}         "electricityRate":3500.5}
```

Alternatives considered.

*An Express `json replacer`*: ruled out on evidence, not preference — `JSON.stringify` applies `toJSON` before the replacer sees the value, so the replacer receives a plain string that cannot be distinguished from a genuine one. Confirmed by direct test.

*Explicit conversion in each service*, in the manner of `customerSelect`: honest and local, and it avoids mutating a library prototype. Rejected because it is thirteen places today and one more per future monetary field, with a silent failure when one is missed — precisely the failure mode being eliminated, relocated from the frontend to the backend.

*A `pg` type parser for the NUMERIC OID*, converting before Prisma constructs a `Decimal`: plausible, but it fights the ORM's declared types — the schema says `Decimal`, and the client's generated types would still say `Decimal` while the runtime value was a number. That mismatch is worse than the prototype override, because the types would lie.

### Where it lives, and why that matters

It goes in `lib/prisma.ts`, beside the client singleton, because that module is already imported before any query runs — so the override is in effect for every response without an explicit initialisation step to forget.

The real cost of this decision is discoverability: a developer reading `invoices/service.ts` sees `Decimal` and would reasonably expect a string on the wire. Nothing at the call site hints otherwise. That is mitigated by putting it in the one module every service already imports, and by a comment stating plainly what is being changed and why. It is a genuine trade, not a free win.

### Precision is verified, not assumed

`Decimal(14,0)` tops out near `1.0e14`, `Decimal(14,2)` near `1.0e12`, `Decimal(12,4)` near `1.0e8`. `Number.MAX_SAFE_INTEGER` is about `9.007e15`. Every column has at least an order of magnitude of headroom, so no representable value loses precision.

This holds because amounts are whole dong and the backend performs all arithmetic. It would stop holding if a currency with minor units at high magnitudes were added, or if the client began computing totals — which is why the reasoning is recorded rather than left implicit.

### `null` is unaffected

A null column stays null: `toJSON` is only consulted on an actual `Decimal`. This matters because an expense with no recorded rate must not read as an expense charged at zero.

## Risks / Trade-offs

- [Mutating a library prototype is invisible from the call sites it affects] → confined to the module every service already imports, with a comment naming the behaviour and the reason. Accepted as the price of not having thirteen opt-ins.
- [Numbers cannot represent arbitrary decimals, so a future column beyond `2^53` would lose precision silently] → the headroom is computed above; a column exceeding it would need a different transport, which is a schema decision that should revisit this.
- [Breaking change for any consumer parsing these as strings] → the only consumer is this repository's frontend, updated in the same change, and no domain screen reads a monetary field yet. This is the cheapest moment it will ever be.
- [The frontend loses its conversion step, so an API regression would surface as a string in the UI rather than being absorbed] → intended. A client-side fallback would hide exactly the regression worth noticing.
- [The local OpenAPI document still describes these fields as strings] → it is gitignored and hand-maintained; refreshing it is a task in this change.

## Migration Plan

No database change and no migration. Deploy the backend before the frontend if they are deployed separately: a frontend expecting numbers against an old backend would show raw strings, whereas the current frontend's conversion tolerates numbers already, since `Number(3000000)` is `3000000`. That asymmetry makes backend-first the safe order.

Rollback is reverting the change; both sides revert together.
