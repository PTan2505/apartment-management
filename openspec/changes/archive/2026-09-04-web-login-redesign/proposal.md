## Why

Sign-in is the first screen anyone sees and the only one a signed-out person can
reach, and it is the one the design system has not touched. It is a bare card
with a heading and two floating-label fields — correct, and looking like nothing
in particular.

The design for it is close to the application: the same two fields, the same one
button, no sign-up link, no password reset, no social sign-in. It understands
that accounts here are created by hand.

It also settles something the current screen leaves open. A password field that
cannot be revealed is a field typed blind, and on a phone — where this
application is used — that is the ordinary case rather than the exception. The
common failure is not forgetting a password but mistyping one, and the screen
currently offers no way to find out which happened.

## What Changes

- The card gains the product mark above the fields, and the mark plus
  **Quản lý trọ** take the place of the `Đăng nhập` heading, as the design has
  it. The word is not lost from the screen — it is what the button says.
- Field labels sit above their fields rather than floating inside them.
- The password field gains a control to reveal what has been typed. It starts
  hidden, and revealing is deliberate and temporary.
- The submit button spans the card's width.
- The card, its spacing and its error block take the design's proportions.

Nothing about what the screen does changes: the same two fields, the same
validation, the same message on rejection, the same distinction between a
rejected credential and an unreachable server.

### Taken from the design and NOT followed

- **The name `AnGia Quản Lý` and the line "Hệ thống quản lý vận hành chuỗi căn
  hộ mini".** The name was settled when the navigation was redesigned:
  `Quản lý trọ` stays. The line is new copy, and copy is not what a design
  supplies.
- **The footer line under the divider.** The design gives two different
  sentences for it — `Tài khoản được cấp bởi quản trị viên hệ thống.` on the
  desktop mock and `Tài khoản do quản trị viên cấp trực tiếp.` on the mobile
  one. That they differ is itself the argument: the words were not decided, and
  the owner declined to add them. Recorded because the question it answers —
  "why is there no way to register?" — is a real one, and someone will ask it
  again.

## Capabilities

### Modified Capabilities

- `web-auth`: the sign-in requirement gains what the screen must do about the
  password being unreadable. This is a change to observable behaviour, not to
  the screen's appearance, which is why it is a requirement and not a note in
  design.md.

## Impact

- `frontend/src/features/auth/pages/LoginPage.tsx` — the whole screen.
- Possibly `frontend/src/app/theme.ts`, if labels-above-fields turns out to be
  the treatment every form should use rather than this one. Decided in
  design.md.
- No API change. Sign-in already sends exactly the two fields it has, and
  revealing a password happens entirely in the browser.
