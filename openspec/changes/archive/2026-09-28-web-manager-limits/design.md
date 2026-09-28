## Context

See proposal.md — Why, and `api-manager-limits/design.md` for the rules themselves.

The application has no per-control role test today. `SidebarAccount` is the only place
that branches on a role, and it does it inline with `user.role !== 'owner'`. Eleven more
places now need the same question answered.

## Goals / Non-Goals

**Goals**

- One way to ask the question, short enough that nobody writes the inline version.
- The boundary is visible before it is hit.
- A manager loses no information, only the ability to change it.

**Non-Goals**

- A permission framework, a `<Can do="...">` component, or a capability map mirrored from
  the backend. There is one role that is narrowed and one that is not; a map would be a
  second copy of the backend's rules, free to drift, to read a boolean from.
- Disabling controls instead of hiding them. A disabled button still asks to be clicked
  and still has to explain itself in a tooltip nobody opens on a phone.
- Re-checking the rules on the client as security. The API refuses; this is about what
  the screen offers.

## Decisions

### One hook: `useIsOwner()`

`const isOwner = useIsOwner()` beside the existing auth hooks, reading the account the
provider already holds. A boolean, not a verb-keyed lookup: the four rules all reduce to
the same question, and naming them individually — `canEditRoom`, `canRecordPayment` —
would be eleven names for one boolean and a maintenance burden the moment a third role
needs a different answer.

If a later role needs finer answers, the hook is the place that grows. Eleven inline
`user.role !== 'owner'` tests are not.

### Hide, do not disable

A hidden control cannot be misread. Where hiding empties a container — the row actions
menu on buildings and rooms, the actions row on the invoice detail — the container is
rendered conditionally rather than left as an empty menu, which is the failure this
change exists to avoid, one level down.

### The money fields are shown read-only, not omitted

MUI's `InputProps={{ readOnly: true }}` rather than `disabled`: a disabled field greys its
value to the point of being hard to read, and the value is exactly what the manager is
reading. The helper text under each already explains where the figure comes from; for a
manager it gains the sentence that says who changes it.

Alternative considered: rendering them as plain text for a manager. Rejected — the form's
layout would differ between roles, and two layouts is two things to keep working.

### The building's deposit field goes beside the rates

It is the same kind of figure — a policy the building applies to tenancies signed later —
and the requirement that already explains "a changed rate reaches tenancies signed from
then on" is the sentence this field needs too.

## Risks / Trade-offs

- **Eleven call sites, and a missed one shows a manager a button that 403s.** → The
  browser pass signs in AS a manager and walks every screen, reading back which controls
  exist, rather than checking the code.
- **A manager may read this as demotion.** → Not a technical matter, but the wording is:
  the read-only fields say the figures are the owner's, not that the manager is
  untrusted.
- **The role description shown when creating a staff account still says a manager "thu
  tiền".** → Owned by `api-manager-limits`' string task; both changes ship together, and
  the new wording needs the owner's approval before it is written.
