## 1. The building's deposit policy

- [x] 1.1 `Building.defaultDepositMonths`, defaulting to one month, with its migration
- [x] 1.2 Accepted on create and update, refused if negative or fractional

## 2. Rooms become the owner's

- [x] 2.1 Create, update, retire and restore require the owner; listing and retrieval do not
- [x] 2.2 The rooms router says why, the way the buildings router does

## 3. The prices on a tenancy

- [x] 3.1 Deposit months become optional, resolving to the building's
- [x] 3.2 A manager supplying rent, either rate, or deposit months is refused, and the refusal names which
- [x] 3.3 The same on a renewal
- [x] 3.4 An owner is unaffected: every override still works

## 4. What a manager may no longer settle

- [x] 4.1 Correcting a tenancy's terms requires the owner
- [x] 4.2 Recording a payment, withdrawing an invoice and reversing a payment require the owner
- [x] 4.3 The tenant's payment link still records itself

## 5. Strings

- [x] 5.1 The role description shown when creating a staff account no longer claims a manager collects money — proposed to the owner before it is written

## 6. Checks

- [x] 6.1 `tsc --noEmit`, `codes:check`, `atomic:check`
- [x] 6.2 Exercised as a manager AND as the owner: each refusal, and that every owner path still works
- [x] 6.3 A manager signs a tenancy naming nothing, and it carries the owner's rent, rates and deposit
- [x] 6.4 Browser-verified with `web-manager-limits`, which is where these rules become visible

## 7. Order

- [x] 7.1 Archive `api-staff-roles` before this change, or its `staff` delta has no main spec to modify
