## Context

See proposal.md — Why. The decisive piece of existing knowledge is the service-fee model,
because this is the same two-level shape and its lessons were learned the hard way:

```
  BuildingServiceFee  (what the building offers)
        │  copied at selection: unitAmount, basis
        ▼
  LeaseServiceFee     (what this tenancy agreed)
```

Furniture adds a level, because furniture belongs to a ROOM and a tenancy only receives
it:

```
  FurnitureItem   building's catalogue
        │  copied when a room is furnished
        ▼
  RoomFurniture   what the room holds, and its condition TODAY
        │  copied, frozen, when a tenancy is signed
        ▼
  LeaseFurniture  what THIS tenant received, and what came back
```

Two other existing decisions bound the design. The schema states that keeping part of a
deposit must go through an ad-hoc invoice, because "a second, weaker place to write the
same fact would only compete". And lease creation already writes the tenancy, its primary
occupant, its portal token, its default fees and its move-in invoice in one transaction.

## Goals / Non-Goals

**Goals**

- "What is in P101?" answerable without a tenancy.
- "What did this tenant get?" answerable years later, unchanged by anything since.
- Damage reaches money through the one path that already exists.

**Non-Goals**

- Photographs of furniture. Room photographs are their own change; tying item-level
  photographs to a hand-over record is a third thing and would double this one.
- Depreciation, serial numbers, warranties, suppliers, maintenance schedules. This is a
  hand-over record, not an asset register.
- Deducting from a deposit. Refused by an existing decision, not by preference.
- Deciding what damage costs. The hand-over value is a starting figure the owner edits.
- Letting a manager maintain the catalogue or a room's furniture. Both are prices.

## Decisions

### Three tables, not two

The tempting simplification is to skip `RoomFurniture` and attach furniture straight to
the tenancy — which is what was first proposed. It fails on the question that started
this: a vacant room would hold nothing, and every signing would mean retyping the list.

The other tempting simplification is to skip `LeaseFurniture` and read the room's current
holdings at move-out. It fails the moment anything is replaced mid-tenancy: the tenant is
then checked against a fridge they never received.

Both levels earn their place by answering a question the other cannot.

### The hand-over record is frozen, and immutable even to the owner

Copied values, and no endpoint to change them. Every other copied value in this system —
a rent, a fee's price, a fee's basis — is immutable for the same reason, but this one is
stronger: the record exists to settle a disagreement, and a record the interested party
can edit afterwards settles nothing.

Correcting a genuine mistake therefore means a note on the tenancy, not a rewrite. That
is a real cost and it is the point.

### Written inside lease creation's transaction

Lease creation already refuses to half-succeed. A tenancy with no hand-over record cannot
be checked in later, and the absence would be discovered at move-out — the worst possible
moment. So it joins the transaction, next to the default service fees added last week for
the same reason.

An empty record is still a record. "Handed over with nothing" is a fact; "nobody wrote it
down" is not, and a nullable record would make the two indistinguishable.

### Condition is an enum of four, with a note

`new | good | worn | damaged`. The comparison at move-out is the only reason condition is
stored at all, and free text cannot be compared. The note carries what the enum cannot —
"xước ở cạnh bên phải" — without being the thing anything branches on.

Four rather than three: `new` and `good` differ in a way that matters on the first
tenancy of a newly furnished room, where everything is new and the tenant should be told
so.

### Checking in is optional, and "unchecked" is a third state

Not checked, returned in good order, and returned damaged are three different facts. A
form where skipping means "fine" converts a tenancy nobody inspected into a tenancy
inspected and cleared, which is exactly the record that will be waved at somebody later.

So the column is nullable and the screens say "chưa kiểm" rather than nothing.

### Damage offers an invoice; it never issues one

The amount prefills from the hand-over value, which is a starting point and not a verdict:
a three-year-old fridge is not worth what it cost. The owner edits it, or declines
entirely. Issuing automatically would mean a tenant discovering the charge before the
owner decided on it.

## Risks / Trade-offs

- **Three tables for what was asked as one many-to-many.** → The middle one is what makes
  a vacant room answerable and stops every signing from being data entry; the third is
  what makes the record survive a replaced fridge. Each was argued against the question it
  answers.
- **The hand-over record cannot be corrected, including genuine mistakes.** → Deliberate.
  A correctable record of what somebody received is not evidence of anything. The escape
  hatch is a note, which is visibly a note.
- **Retro-fitting tenancies that already exist.** Every current tenancy will have no
  hand-over record, and at move-out there will be nothing to check in. → The screens must
  say "no record" rather than "handed over with nothing", because for these two are not
  the same and only one of them is true. Worth a task of its own.
- **Lease creation grows a fifth thing in its transaction.** → It is a `createMany` over a
  list usually under ten rows; the pattern is the one default service fees already use.
- **Two catalogues on the building's page now.** Service fees and furniture, side by side
  and easy to confuse. → Each must say what it does: one is charged monthly, the other is
  handed over once.
