## Context

See proposal.md — Why. What shapes the approach:

- Three screens already exist (`web-foundation`, `web-buildings`, `web-rooms`), so the list-with-filters shape is settled: `useListParams` owns filters and page in the URL, `SearchField` debounces, `Pagination` and `EmptyState` are shared, and both a table and a card variant stay mounted and are toggled with `sx.display`.
- `POST /customers` answers **201** when it created someone and **200** when the phone number matched an existing customer, in which case it returns that person and discards the submitted name. `409` is reserved for a number belonging to an owner account.
- The API's customer representation is `id`, `phone`, `fullName`, `role`, `createdAt`, `updatedAt`. `phone` is nullable.
- `PATCH /customers/:id` accepts a partial body and answers `409` when the phone number belongs to someone else.

## Goals / Non-Goals

**Goals:**

- Make the three outcomes of adding a customer distinguishable to the owner, not just to the code.
- Reuse the established list shape rather than inventing a second one.

**Non-Goals:**

- A detail route, lease information, or any lifecycle action. See proposal.md.
- Generalising the list machinery further. `web-rooms` already settled that bet: what repeats has been extracted, and what looked like it would repeat did not.

## Decisions

### Branch on the status code, not on `response.ok`

This is the decision the change exists for. The natural implementation — `await createCustomer(...)`, then `onSuccess: () => toast('Created')` — is wrong here, and wrong silently: `200` and `201` are both successes to axios and to react-query, so a phone clash would render as a creation that never happened.

So the API layer returns the status alongside the customer:

```
  201  →  { created: true,  customer }
  200  →  { created: false, customer }   ← customer is the EXISTING person
  409  →  throws ApiError (existing handling)
```

`created` is what the dialog branches on. It is derived at the one place that can see the status code, rather than being inferred later from something that only correlates with it.

**Alternatives considered:**

- *Compare the returned name to the submitted one.* Rejected: two people can share a name, so it is wrong exactly when someone with the same name already holds that number — the case most likely to confuse.
- *Check the phone before submitting.* Rejected as the primary mechanism: it adds a request per keystroke and still cannot be trusted, since the number can be taken between the check and the submit. The 200 branch has to be handled regardless, so a pre-check would be a second mechanism for a case the first already covers.

### Keep the dialog open on 200, with values intact

A phone clash is most often a mistyped digit. Closing the dialog would discard a correctly-typed name to report a wrongly-typed number, forcing the owner to retype the part that was right.

Staying open also makes the message harder to miss: a toast on a closed dialog competes with the list re-rendering behind it, and the owner's attention has already moved on.

The 409 branch behaves the same way, for the same reason.

### The message names the person

"That phone number is already in use" is true and useless — the owner cannot tell whether they typed the wrong number or are looking at someone they already added. The API returns the holder, so the message says who:

```
  0912345678 already belongs to Nguyễn Văn A.
  That existing record was used — the name you entered was not saved.
```

The second sentence is the part that prevents the wrong belief. Without it the owner may still think their entry was recorded under that number.

### Sort order and the new-row problem

The API orders customers by `createdAt` ascending, so a new customer lands last — on the final page, which is usually not the page being viewed. `web-buildings` hit exactly this and it read as the form having done nothing.

The fix there was to jump to the page the new row is on, and the same applies here. Reusing it rather than rediscovering it is the point of having hit it once.

### No `RowActions` component

Rooms need a menu because they carry edit, retire, and restore. A customer carries edit alone, so a menu would be a menu with one item in it. A plain button, in both the table and the card.

This is also why `web-rooms`' `RoomRowActions` is not generalised into a shared component here: the two rows do not have the same problem.

## Risks / Trade-offs

- **The 200 branch is easy to regress.** Nothing in the type system distinguishes it once `created` is dropped; a future refactor that returns just the customer would reintroduce the bug silently. → The API layer returns a shape that has no customer without a `created` flag beside it, so dropping the flag is a type error rather than a behaviour change. Verification covers the branch explicitly rather than only the happy path.

- **`created: false` is a success that must not read as one.** A caller that treats any resolved promise as "it worked" gets it wrong. → Named `created` rather than `ok` or `success` precisely so the wrong reading is awkward to write, and stated in the spec as its own scenario.

- **Verifying "no horizontal scroll" is easy to get wrong.** A previous check on this project reported clipping that turned out to be a headless-browser artefact, and `overflowX: hidden` masks the problem rather than fixing it. → Measure actual overflow rather than eyeballing a screenshot, and rely on `minWidth: 0` on the flex content area, which is what actually prevents it.
