## 1. The reading

- [x] 1.1 An invoiced reading counts as a candidate, dated at the period it billed
- [x] 1.2 The reported `source` says so, and the frontend type matches

## 1b. The floor a closing reading must clear

- [x] 1b.1 A tenancy reports where its own invoices leave the meter, from the same rule the API refuses below
- [x] 1b.2 The move-out and renewal dialogs offer that figure, not the room's
- [x] 1b.3 A reading below it is refused on the screen, before the request

## 2. Checks

- [x] 2.1 `tsc --noEmit` both sides, lint, both builds
- [x] 2.2 Every running tenancy's hint is at least what has been invoiced — counted before and after
- [x] 2.3 Verified in a visible browser: the move-out dialog offers a figure the API accepts
