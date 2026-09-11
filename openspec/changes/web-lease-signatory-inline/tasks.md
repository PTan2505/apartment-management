## 1. The field

- [x] 1.1 Replace the select with a typing field that suggests existing customers as the owner types
- [x] 1.2 Picking a suggestion behaves exactly as the select did
- [x] 1.3 Filter the customers already loaded rather than querying per keystroke
- [x] 1.4 Show the phone field only once the typed name matches nobody

## 2. Adding somebody new

- [x] 2.1 Require a phone number for a newly typed person, and say why it is needed
- [x] 2.2 Create the person on SUBMIT, never on blur — creating on blur leaves a customer behind every time a form is opened and abandoned
- [x] 2.3 Refuse a name with neither a selection nor a phone, naming which is missing

## 3. The number that belongs to somebody else

- [x] 3.1 On `created: false`, STOP and show whose number it is — the typed name was discarded by the API and cannot be recovered by comparing names
- [x] 3.2 Let the owner accept the matched person and continue
- [x] 3.3 Let the owner go back and change what they entered — the "Sửa lại" button is present; clicking it was not separately exercised
- [x] 3.4 Report a number belonging to an OWNER account as its own case, not as "already taken"

## 4. When the lease fails after the person was created

- [x] 4.1 Keep the created person selected, so retrying does not create a second one — exercised by holding `POST /leases` open with a CDP request intercept and signing the room away over the API while it hung. Retried onto a free room: customers 13 → 13, leases 14 → 15, and exactly one record carries the phone. The retry read `createdRef` instead of calling `POST /customers` again
- [x] 4.2 Report the lease failure as itself — a room taken in the meantime says so — "Phòng này đang có hợp đồng." against the room field alone. The name, dates, deposit and meter reading all survived, and the customer count still rose 12 → 13: the person was created and kept, which is the deliberate order

## 5. Verification, in a visible browser

- [x] 5.1 `tsc --noEmit` and `npm run lint` pass, and the production build succeeds
- [x] 5.2 Sign in from a signed-OUT browser, asserting the form is present before typing
- [x] 5.3 Type part of an existing customer's name and confirm the suggestion appears; pick it and sign a tenancy
- [x] 5.4 Confirm no customer was created by that path — count customers before and after
- [x] 5.5 Type a name nobody has, supply a phone nobody has, and sign — confirm BOTH the customer and the lease exist afterwards
- [x] 5.6 Type a new name with a phone that ALREADY belongs to another customer, and confirm the screen names that person and does not sign
- [x] 5.7 Accept the match and confirm the tenancy is signed to the person on file, under their existing name
- [x] 5.8 Try a new name with no phone and confirm it is refused with a reason
- [x] 5.9 Use the OWNER's own phone number and confirm the message is distinct from the customer case
- [x] 5.10 Count customers at the end and confirm the number matches what the steps above should have created — no strays from abandoned forms
- [x] 5.11 Mobile pass at 390px, with horizontal overflow measured at every scroll position — list scrolled 0/400/800/1200, form content scrolled 0/92/184, `scrollWidth` 390 throughout. The first form scan was VACUOUS: MUI sets `body { overflow: hidden }` while a dialog is open, so four `window.scrollTo` calls all measured `scrollY: 0`. The real scroller is `.MuiDialogContent-root`; re-measured there

## 6. Three defects the verification found, all mine

- [x] 6.1 The phone field opened on the FIRST keystroke of an existing customer's name. Keyed on "the name is non-empty"; it now also requires that the text match nobody
- [x] 6.2 `inputValue` was passed as `undefined` when somebody was picked, flipping the field between controlled and uncontrolled. MUI then cleared the text on blur, so clicking submit wiped the typed name and the form refused with "nhập tên" for a name that had just been on screen
- [x] 6.3 `onInputChange` ignored only `reason === 'reset'`. A blocklist let another reason through; it now accepts only `'input'`
- [x] 6.4 The suggestion list had NO shadow and no border — MUI's Select menu asks for `elevation={8}` itself while the Autocomplete takes the theme's default of 0, so the options floated on the dialog behind them. Fixed in the theme from `theme.shadows[8]`, so the two dropdowns match by construction rather than by a copied string
- [x] 6.5 An English string was sitting on this form: `'Signing a tenancy for this room'`
