# Tasks

## 1. Module scaffolding

- [x] 1.1 Add `frontend/src/features/customers/types.ts` — the customer shape the API returns, with `phone` nullable.
- [x] 1.2 Add `frontend/src/features/customers/api.ts`. `createCustomer` must return `{ created, customer }`, deriving `created` from the response status (201 vs 200) at the one place that can see it. Do not return a bare customer — the caller cannot recover the distinction afterwards.
- [x] 1.3 Add `frontend/src/features/customers/schema.ts` — zod schema for the form: name required, phone optional.
- [x] 1.4 Add `frontend/src/features/customers/hooks.ts` — the list query and the create/update mutations, invalidating the list on success.

## 2. List

- [x] 2.1 Add `CustomerList.tsx` with both presentations: a table for wide viewports and cards for narrow ones, both always mounted and toggled with `sx.display` rather than `useMediaQuery`, so the first render is not wrong.
- [x] 2.2 Render an absent phone number as a dash, not as an empty cell.
- [x] 2.3 Add `CustomersPage.tsx` wiring `useListParams`, `SearchField`, and `Pagination`.
- [x] 2.4 Distinguish the three empty-ish states: loading, failed, and genuinely empty. A failure must not render as an empty list.
- [x] 2.5 Use `EmptyState` for both "no customers at all" and "nothing matched this search", with different wording — the second offers to clear the search.
- [x] 2.6 Point `/customers` at the real page instead of the placeholder.

## 3. Create and edit dialog

- [x] 3.1 Add `CustomerFormDialog.tsx` handling both create and edit, opening with current values when editing.
- [x] 3.2 Add `noValidate` to the form. Without it the browser's own validation fires before react-hook-form and the field message never appears — this has bitten both previous form dialogs on this project.
- [x] 3.3 Branch on `created` for the create result: on `true`, confirm by name and close; on `false`, report the clash and keep the dialog open with values intact.
- [x] 3.4 Write the clash message so it names the person holding the number and states that the entered name was not saved. "Already in use" alone does not tell the owner which mistake they made.
- [x] 3.5 Handle 409 (number belongs to an owner account) with its own message, dialog staying open.
- [x] 3.6 Handle 409 on edit (number belongs to someone else), dialog staying open.
- [x] 3.7 After creating, jump to the page the new customer is on — they sort last by `createdAt`, so otherwise the addition appears to have done nothing.

## 4. Checks

- [x] 4.1 `tsc --noEmit` passes.
- [x] 4.2 Confirm no lifecycle action (delete/retire/deactivate) appears anywhere in the screen.

## 5. Verification in the browser

Against a running frontend and backend, failure paths included — not just the happy path.

- [x] 5.1 Seed customers to verify against, including names with diacritics, a name containing `Đ`, and at least one customer with no phone number.
- [x] 5.2 The list shows names and phone numbers, and the customer without a phone shows a dash.
- [x] 5.3 Searching `nguyen van a` finds `Nguyễn Văn A` — the accentless case this screen was waiting on.
- [x] 5.4 Searching in a different case, and searching by partial phone number, both find the right customer.
- [x] 5.5 A search matching nothing shows the "nothing matched" state with a way to clear it, distinct from the no-customers state.
- [x] 5.6 The search survives a reload, and changing the search returns to page 1.
- [x] 5.7 The browser back control does not step through the search text one character at a time.
- [x] 5.8 Creating a customer with an unused phone number confirms by name and closes.
- [x] 5.9 Creating a customer with **no** phone number succeeds.
- [x] 5.10 Creating a customer with a phone number that already belongs to another customer names that person, states the entered name was not saved, does **not** say a customer was created, and leaves the dialog open with the values still in it. This is the case the whole change exists for.
- [x] 5.11 Confirm no extra customer was actually created in that case — the count is unchanged.
- [x] 5.12 Creating with a phone number belonging to an owner account reports that and keeps the dialog open.
- [x] 5.13 Submitting with an empty name shows the message against the name field and does not submit.
- [x] 5.14 A newly created customer is visible without a manual reload, including when they belong on a later page.
- [x] 5.15 Editing opens with current values; saving updates the row without a reload.
- [x] 5.16 Adding a phone number to a customer who had none succeeds.
- [x] 5.17 Editing to a phone number already in use reports it and keeps the dialog open.
- [x] 5.18 Renaming a customer makes them findable by the new name, searched without diacritics.
- [x] 5.19 Table on a wide viewport, cards on a narrow one, with the same actions in both.
- [x] 5.20 Measure actual horizontal overflow at a small phone width rather than judging from a screenshot, and confirm it is zero without relying on `overflowX: hidden`.
- [x] 5.21 Remove the verification data, leaving the database as it was found.
