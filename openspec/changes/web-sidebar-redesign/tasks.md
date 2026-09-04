## 1. Selection treatment

- [x] 1.1 In `theme.ts`, make a selected `MuiListItemButton` a filled accent row with white text, replacing the pale tint — so selection and hover differ by kind rather than by one step of lightness
- [x] 1.2 Make the icon and label inherit the row's foreground, and check both read against the fill
- [x] 1.3 Confirm the hover tint on an UNselected row is unchanged, and that hovering the selected row does not wash it out

## 2. The sidebar's two ends

- [x] 2.1 Add the brand block: the product mark beside `Quản lý trọ`. No tagline — that would be new copy, and the name is settled
- [x] 2.2 Add the identity block at the foot of the shared navigation list, so it appears in the permanent drawer and the temporary one without a second implementation: initials avatar, `fullName`, role, phone
- [x] 2.3 Derive the initials from `fullName`; handle a single-word name and a name with more than two words without producing three letters
- [x] 2.4 Pin the identity block to the bottom with the destination list scrolling above it, so a short viewport does not push it off

## 3. The strings that were already wrong

- [x] 3.1 Show the role as `Chủ nhà` rather than the stored `owner`. Map it — do not print the enum
- [x] 3.2 Replace `No phone recorded` in `AccountMenu` with Vietnamese
- [x] 3.3 Check no other English string is left in either file

## 4. The account control on the top bar

- [x] 4.1 Hide `AccountMenu` at and above `MOBILE_BREAKPOINT`, where the sidebar now carries identity — two controls for one thing on one screen is what the design removed
- [x] 4.2 Keep it below the breakpoint, so signing out on a phone does not require opening the navigation first
- [x] 4.3 Confirm both routes to sign-out end in the same state: signed out, back at `/login`

## 5. Verification in a real browser

- [x] 5.1 `npx tsc --noEmit` and `npm run lint` both pass
- [x] 5.2 At 1440px: the sidebar against the design, and no account control on the top bar
- [x] 5.3 At 390px: the drawer open, identity at its foot, and the top bar's account control still present
- [x] 5.4 Filter the invoice list by building and by month, then click a row through to its detail — the behaviour this change must not have altered
- [x] 5.5 Walk all seven destinations and confirm each marks itself selected, at both widths
- [x] 5.6 Sign out from the drawer, sign back in, sign out from the top bar
- [x] 5.7 Measure horizontal overflow at both widths; it must be zero
