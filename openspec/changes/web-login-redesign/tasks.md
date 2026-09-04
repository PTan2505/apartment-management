## 1. The card's head

- [x] 1.1 Add the product mark above the fields, matching the one the navigation uses so the two are the same mark rather than two drawings of one
- [x] 1.2 Replace the `Đăng nhập` heading with `Quản lý trọ`, and make it the page's `h1` so the document is not left without one
- [x] 1.3 Take the design's card width, padding and spacing; no footer line and no tagline

## 2. The fields

- [x] 2.1 Move both labels above their fields, on this screen only — not in the theme, which would restyle forms nobody has looked at
- [x] 2.2 Make the submit button span the card's width
- [x] 2.3 Confirm the required-field messages still appear where a reader will see them, now that the label no longer sits inside the field

## 3. Revealing the password

- [x] 3.1 Add the reveal control to the password field, flipping `type` on the same input rather than swapping in a second one
- [x] 3.2 Name it for the action it performs — `Hiện mật khẩu` when concealed, `Ẩn mật khẩu` when revealed — not for the state the field is in
- [x] 3.3 Keep the revealed state in component state, so a reload conceals it again without anything having to remember to reset it
- [x] 3.4 Check the control is reachable and operable by keyboard, and that using it does not submit the form

## 4. What must not have changed

- [x] 4.1 The submit error keeps its severity distinction: `warning` when the server could not be reached, `error` when credentials were rejected
- [x] 4.2 The expired-session notice still appears, and is still suppressed once a submit error exists

## 5. Verification in a real browser

- [x] 5.1 `npx tsc --noEmit` and `npm run lint` both pass
- [x] 5.2 The screen at 1440px and at 390px, against the design
- [x] 5.3 Sign in with the wrong password: the API's message appears, unchanged, and no session is established
- [x] 5.4 Submit with each field empty in turn: the screen says which is required and issues no request
- [x] 5.5 Reveal the password, read it, conceal it, then reload and confirm it is concealed
- [x] 5.6 Reach the screen with an expired session and confirm the notice appears — it is absent from the design's mock, which is exactly why it is checked rather than eyeballed
- [x] 5.7 Sign in for real, then filter the invoice list by building and by month and open a row. This is the end of the path this change sits at the start of; the screens themselves are untouched, so a failure here would mean sign-in broke them
- [x] 5.8 Measure horizontal overflow at both widths; it must be zero
