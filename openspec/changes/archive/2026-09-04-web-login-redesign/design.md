## Context

See proposal.md — Why.

`LoginPage` today is a `Card` at `maxWidth: 400` containing a heading, up to one
`Alert`, and a `Stack` of two MUI `TextField`s with floating labels. It carries
two distinct alerts that are easy to lose in a redesign:

- a session-expired notice, shown only when the previous session ended on its
  own, and suppressed once a submit error exists;
- a submit error whose severity changes with the kind of failure — `warning` for
  an unreachable server, `error` for rejected credentials — because a connection
  problem is not a typo and sending someone hunting for one wastes their time.

Both are behaviour the spec already requires. Neither appears in the design,
which draws one error state.

## Goals / Non-Goals

**Goals**

- The screen reads as the design draws it, in the product's own name.
- The password can be checked by the person typing it.

**Non-Goals**

- Changing anything about what the screen accepts, sends, or says on rejection.
- Deciding how every form in the application labels its fields. See below.

## Decisions

### Labels move above the fields on THIS screen only

The design puts labels above the fields. MUI's default floats them inside, and
that is what every other form in the application uses.

The change stays local. Making it a theme default would restyle the invoice
filters, the billing run's meter inputs, and every dialog — none of which were
designed, reviewed, or looked at. A treatment applied to screens nobody examined
is not a design system, it is a global find-and-replace.

If the design later covers those screens and they agree, the rule can move into
the theme with evidence behind it. Two examples is not enough; this is one.

### The reveal control is `type` switching, not a second field

The field's `type` flips between `password` and `text` on the same input. The
alternative — two inputs, one shown at a time — loses the caret position and the
undo history, and browsers have been known to autofill them inconsistently.

Its accessible name states the ACTION, not the state: `Hiện mật khẩu` when
concealed, `Ẩn mật khẩu` when revealed. Naming the current state instead is the
common mistake and it inverts the meaning — a reader hearing "password hidden"
on a button reasonably expects pressing it to hide the password.

Revealed state lives in component state, so a reload concealing it again is a
property of where it is kept rather than something to remember to reset.

### The brand mark takes the `h1`

The design drops the `Đăng nhập` heading and the owner chose to follow it. The
page still needs one top-level heading, and after this change the only candidate
is the product name — so `Quản lý trọ` becomes the `h1` rather than leaving the
document with none.

The word `Đăng nhập` is not lost from the screen. It is what the button says,
and what the button says is what the screen is for.

### Both alerts survive, in the design's one error slot

The design draws one error block. There are two states that use it and they
must not be merged: the expired-session notice and the submit error already
suppress each other, so at most one is visible, and the slot the design draws is
exactly big enough for the one that is.

What the design does not carry is the severity distinction, which stays.

## Risks / Trade-offs

**Revealing a password is a shoulder-surfing risk** → It is off by default, it
takes a deliberate act, and it does not survive a reload. The alternative — no
way to check what was typed — trades a risk the user chooses to take for one
they cannot avoid.

**Labels above the fields make this screen inconsistent with every other form**
→ Accepted and named above. The inconsistency is visible on one screen; the
alternative changes screens nobody has looked at.

**The design's mock omits the expired-session alert entirely, so following it
closely could quietly drop it** → It is in the tasks as something to exercise,
not to eyeball: reach the screen with an expired session and confirm the notice
still appears.

## Open Questions

None. The mark, the name, the footer line and the reveal control were all put to
the owner before this was written.
