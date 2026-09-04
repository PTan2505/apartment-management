## Why

The theme changed the application's colour and typeface, and the invoice screen
gained a surface. The navigation did not change at all, and it is now the part
of the screen least like the design: a plain list under a plain heading, with
the signed-in person's identity sitting somewhere else entirely.

The design supplied for the navigation is worth following closely, unlike the
one for the invoice screen. It lists exactly the seven destinations the
application has — Toà nhà, Phòng, Khách, Hợp đồng, Hoá đơn, Chi phí, Doanh thu —
in the order `app/navigation.ts` already has them. It is a treatment of this
product rather than a proposal for a different one.

Two existing faults are visible in the same components and get fixed here rather
than left for a change that would touch the same files again:

- `AccountMenu` shows `No phone recorded` when a phone is missing. English, on a
  screen `web-infrastructure` requires to be entirely Vietnamese.
- It prints `user.role` raw, so the owner reads `owner` rather than `Chủ nhà`.

## What Changes

- The selected destination is a filled row in the accent colour with white text,
  as the design shows. It is currently a pale tint, which the design uses for
  hover rather than for selection.
- The sidebar gains a brand block: the product mark beside its name.
- The signed-in person moves to the foot of the sidebar — avatar with initials,
  full name, role, phone — with sign-out beneath. On mobile this lives at the
  foot of the drawer, which is where the design puts it.
- `Chủ nhà` replaces the raw `owner`, and the missing-phone line becomes
  Vietnamese.

The name stays **Quản lý trọ** and the accent stays **#0F766E**. The design
proposes `AnGia Quản Lý` and lists `#005C55` alongside `#0F766E` in its notes;
both were put to the owner and both were declined. They are recorded here so
that a later reader comparing the screen against the image does not read the
difference as an oversight.

### Deliberately not in this change

- **The count badge on Hoá đơn.** Not blocked by the API — a filtered list
  returns `meta.total`, so `paymentStatus=pending` would give the number. It is
  excluded because it would put a query in the shell, making every screen in the
  application issue one more request, and that is a behavioural change wearing a
  visual change's clothes. Its own change.
- **The building selector in the drawer's header** ("Toàn bộ (3 cơ sở)"). A
  scope that applies across screens is a feature, not a treatment.
- **Moving the account control off the top bar entirely.** The design's desktop
  bar has no account menu, because the sidebar has it. Removing it would leave
  the mobile top bar with no way to sign out without opening the drawer first.
  What happens to the top bar is settled in design.md.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `web-infrastructure`: the requirement that the shell adapts its navigation to
  viewport width gains what the navigation must SAY at each width — which
  destination is current, and who is signed in. Both are already true of the
  application; neither is written down, so nothing currently stops a redesign
  from dropping either.

## Impact

- `frontend/src/layouts/AppShell.tsx` — the sidebar and drawer.
- `frontend/src/features/auth/AccountMenu.tsx` — the identity block and its two
  untranslated strings.
- `frontend/src/app/theme.ts` — the selected-row treatment, so it is defined
  once rather than on this screen.
- No API change. `/auth/me` already returns `fullName`, `phone` and `role`,
  which is everything the design's identity block shows.
