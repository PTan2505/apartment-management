## Context

See proposal.md — Why.

What constrains the work is where the pieces are today. `AppShell` builds one
`navigationList` and renders it into two `Drawer`s — permanent above `md`,
temporary below — so anything added to that list appears in both forms with no
second implementation. The signed-in person is not in either: `AccountMenu`
sits in the `AppBar`, top right.

The design puts identity at the foot of the sidebar and shows no account control
in its desktop top bar.

## Goals / Non-Goals

**Goals**

- The navigation reads as designed at both widths.
- Identity is stated once and appears in both forms, like the destination list.

**Non-Goals**

- Any change to what the destinations are or where they lead. The design's list
  matches `app/navigation.ts` exactly, which is why this change can be visual.
- Anything that issues a request. See the badge, deferred in the proposal.

## Decisions

### The top bar keeps an account control; the sidebar gains one

The design shows identity only in the sidebar, and it is right for the desktop
form it draws. Following it literally would take sign-out off the mobile top bar
and leave it only inside a drawer that is closed by default.

That is a real loss and not a visual one. Signing out is what a person does when
they are handing the phone over or have finished — and requiring them to open a
navigation panel first, on the screen where the panel is hidden, is a worse
answer than the one the application already has.

So: the sidebar gains the full identity block, and the top bar keeps a compact
account control **on narrow viewports only**. Above `md` the top-bar control
goes, because there the sidebar is permanently visible and two controls for one
thing is the confusion the design was avoiding.

The alternative — keep the top-bar menu at both widths — was rejected because it
would leave the desktop screen with the person's name twice, which is what the
design changed.

### Selection is a filled row; hover stays a tint

The design's selected destination is a solid accent fill with white text. The
theme currently gives selection a pale tint, and gives table rows a slightly
paler tint for hover.

Two tints one step apart is exactly the failure the modified requirement names:
a reader cannot tell the destination they are on from the one the pointer
happens to be over. Filling the selected row separates them by kind rather than
by degree.

This lands in `theme.ts` on `MuiListItemButton`, not on `AppShell`, so the
navigation is not the only list in the application that answers the question
this way.

### Initials come from the name already loaded, not from a new field

The design's avatar shows `NA`. `/auth/me` returns `fullName`, so the initials
are derived from it in the browser.

This is derivation, not the frontend inventing a field: an initial is a way of
writing a name shorter, not a separate fact about a person, and there is nothing
for an API to be the source of truth about. It differs from the invoice screen's
paid/outstanding split, which is a rule about money that the backend already
implements — the test is whether getting it wrong would put a WRONG FACT on
screen or merely an ugly one.

### The brand block gets a mark, not a tagline

The design's header is a mark, the product name, and a line under it reading
"Vận hành chuỗi căn hộ". The name is settled — it stays `Quản lý trọ`. The
tagline would be new copy, and copy is not what a design supplies; this change
adds the mark and leaves the words alone.

## Risks / Trade-offs

**Two account controls at narrow width — the drawer's and the top bar's** →
Accepted, and it is the point. They are the same action offered where the reader
is, and the alternative is that one of the two widths cannot sign out
conveniently. Both must sign out the same way; the tasks verify this from both.

**Filling the selected row makes its icon and label sit on the accent, where the
current icon colour will not read** → The icon takes its colour from the row, so
this must be checked at both widths rather than assumed. It is in the tasks.

**The foot of the sidebar competes with the destination list for space on a
short viewport** → The identity block is pinned to the bottom and the list
scrolls above it. Verified at 844px, the height the design draws.

## Open Questions

None. The three that would have changed this change — the badge, the product
name, and which accent — were put to the owner before it was written, and all
three are recorded in the proposal.
