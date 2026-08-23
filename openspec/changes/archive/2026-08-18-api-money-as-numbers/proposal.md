## Why

Every monetary value the API returns is a JSON **string**. Services hand Prisma `Decimal` values straight to `res.json()`, and `Decimal.toJSON()` produces `"3000000"`, not `3000000`.

That is not a shape any caller wants. Arithmetic silently misbehaves, sorting is lexicographic (`"9"` above `"10"`), and `toFixed` throws. There are 13 `Decimal` columns across five models plus the revenue report's computed totals, so every client has to remember which fields need converting, forever.

`web-foundation` addressed this on the frontend, with a helper, a convention, and a cautionary comment telling future changes to name their monetary fields explicitly. That was the wrong side of the wire. Writing that much scaffolding to defend callers against a data shape is a sign the shape itself is wrong — and we own the API. Fixing it once at the source means every consumer benefits: the web app, Postman, the OpenAPI document, and anything added later.

## What Changes

- **BREAKING**: monetary values are transported as JSON numbers instead of strings. Every endpoint returning an amount, a rate, or a quantity is affected.
- The conversion happens once, where the Prisma client is created, rather than field by field in each service. Nothing in any domain service changes.
- The frontend's conversion helpers are deleted, since the values arrive correct. The VND display formatter stays — that is presentation, not transport.

### Why the conversion cannot be a serializer

The obvious approach is an Express `json replacer`. It cannot work: `JSON.stringify` calls a value's `toJSON` **before** handing it to the replacer, so by then a `Decimal` is already an ordinary string and cannot be told apart from a genuine one. Verified directly — a replacer receives `"3000000"` with `instanceof Decimal === false`.

That leaves converting where `Decimal` decides its own JSON form.

### Why numbers are safe for these columns

The usual objection is precision. It does not apply here, because every column fits exactly inside the range JavaScript integers represent without loss:

```
Decimal(14,0)   max  99,999,999,999,999    ≈ 1.0e14   ┐
Decimal(14,2)   max     999,999,999,999.99 ≈ 1.0e12   ├─  all well below
Decimal(12,4)   max          99,999,999.9999          ┘   9.007e15
```

Amounts are whole dong, already rounded server-side. The API performs every calculation; consumers display and sort.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `api-infrastructure`: adds a requirement fixing how monetary values are represented in responses, alongside the existing error-shape and pagination contracts.
- `web-infrastructure`: "Monetary values are numbers before any screen uses them" — the requirement still holds, but it is now satisfied at the source rather than by conversion in the client.

## Impact

- **Code**: `backend/src/lib/prisma.ts` only. No service, controller, schema, or router changes. On the frontend, `src/lib/money.ts` loses its conversion helpers; the display formatter moves to `src/lib/format.ts`.
- **Database**: none. No schema change, no migration. Columns stay `Decimal` — this is purely how they are serialised.
- **API surface**: no new or removed endpoints. The *type* of existing fields changes from string to number.
- **Behavioral change**: any consumer parsing these fields as strings breaks. The only consumer today is this repository's frontend, updated in the same change, and no domain screen reads a monetary field yet. The local OpenAPI document should be refreshed.
- **Dependencies**: none.
- **Out of scope**: no change to rounding, currency handling, or how amounts are calculated. Dates, ids, phone numbers, and room codes are untouched — this concerns `Decimal` columns only.
