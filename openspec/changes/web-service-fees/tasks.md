## 1. Where the catalogue lives

- [x] 1.1 `BuildingServiceFee`, its listing and its hook move to `features/buildings`
- [x] 1.2 The move-out dialog and the building page point at the new home

## 2. The building's catalogue

- [x] 2.1 Add, rename and reprice, retire, restore — owner only
- [x] 2.2 Retired fees kept visible and set apart
- [x] 2.3 The card says a fee here charges nobody until a tenancy takes it up
- [x] 2.4 A duplicate name is refused with the reason, and the form stays open

## 3. A tenancy's fees

- [x] 3.1 List what it is billed for, with the monthly total
- [x] 3.2 Attach from the catalogue with a quantity and optional start date, previewing the monthly amount
- [x] 3.3 Change the quantity; stop a fee, from that day forward
- [x] 3.4 A fee the building has retired still shows as charged, and says so
- [x] 3.5 A finished tenancy shows its fees and offers no changes

## 4. Strings

- [x] 4.1 New Vietnamese strings reported for review

## 5. Checks

- [x] 5.1 `tsc --noEmit`, lint, build
- [x] 5.2 In a visible browser as the OWNER: add a fee, attach it to a tenancy, read the monthly total — 1440px and 390px
- [x] 5.3 As a MANAGER: the catalogue readable with no controls; attaching to a tenancy still works
- [x] 5.4 End to end: close a month and confirm the invoice carries the fee line by itself, with the tenancy's own price
