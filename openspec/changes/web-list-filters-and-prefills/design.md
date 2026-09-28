## Context

See proposal.md — Why. Three constraints:

- `vacant` on the rooms listing is a flag, and a flag cannot ask the opposite question.
  Its "false" already means "do not narrow", so it could not be reused.
- Eleven filters needed the same control. Written eleven times, the details that make an
  Autocomplete behave — matching by value rather than object identity, one spelling of
  "not chosen" — would be got right in some of them.
- The two meter fields were blank on purpose, with the reason written down. Reversing it
  is the owner's call, not a tidy-up.

## Goals / Non-Goals

**Goals**

- The status column answers the question people actually ask of a room.
- One control for every typed-list filter, so they behave identically.
- No screen shows a control the reader cannot use.

**Non-Goals**

- Turning closed dropdowns into comboboxes. Four fixed entries are read, not searched.
- A generic "hide by role" wrapper. Two call sites ask; a third would be the time.
- Changing what `vacant` means. Existing callers — the tenancy form's room picker —
  depend on it, so `occupancy` is added beside it rather than replacing it.

## Decisions

### `occupancy` is added, `vacant` is left alone

Both end up in the same Prisma `where`, and both speak about `leases`. They go in ONE
`AND`, with the scope filter already there.

That is not tidiness. Written as a second `AND` key, TypeScript refused the duplicate
property outright — which is how the collision was found. Written as two spread `leases`
keys, nothing would have refused, and the later would silently have replaced the
earlier: the same failure that once let a manager read another building's rooms.

### The retired row keeps a label as well as the grey

Asked for as "background gray". Implemented as grey AND a quiet "Đã ngưng", because grey
alone fails in three ordinary situations — a screenshot, a reader who cannot pick the
shade out, a phone card with no neighbour to compare against — and because the
alternative label the cell would otherwise carry, "Còn trống", is worse than useless: it
invites signing a tenancy on a room the API will refuse.

The positive mark is the one that went. "Đang hoạt động" on almost every row marked
nothing.

### One `PickerField`, matched by value

React Query hands back a NEW array on every refetch. An Autocomplete comparing its
selected object by identity then finds nothing equal to it in the fresh list and clears
itself — a field that empties on a background refetch, and only sometimes. Matching by
`value` is the whole reason this is one component rather than eleven.

`allLabel` does double duty: it is the placeholder, and its presence is what makes the
control clearable. A required choice cannot be cleared into nothing, so it does not
offer to.

### The actions column is gated by role, not by emptiness

`coThaoTac = useIsOwner()`, as asked, rather than "does any row have an action". The
consequence is real and worth stating: a manager loses the "Hợp đồng mới" shortcut that
lived in that menu. They can still sign from the tenancy screen, choosing the room in
the form instead of starting from the room in front of them.

## Risks / Trade-offs

- **A prefilled meter reading gets accepted unread**, and the month bills 0 kWh of
  electricity. The tenant does not query it and the owner loses money quietly. → Put to
  the owner with that consequence named; they chose it. The floor check still refuses a
  reading below what was invoiced, which catches the reversed-meter case but not this one.
- **A manager cannot start a tenancy from the rooms list any more.** → Named above;
  reversible by gating the column on "has any action" instead of on the role.
- **Eleven call sites converted in one pass.** A bulk transform produced broken JSX and
  was reverted; they were then done by hand, in pairs, type-checking between. → The
  browser pass opens the converted filters and reads back what they offer.
