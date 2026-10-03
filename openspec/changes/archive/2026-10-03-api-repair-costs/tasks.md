## 1. The link between a repair and its cost

- [x] 1.1 `Expense.damageReportId`, nullable and unique, with its migration
- [x] 1.2 Existing expenses unaffected — every current row keeps meaning what it meant

## 2. Recording it

- [x] 2.1 Record a cost on a report: building and room from its tenancy, category `repair`, origin `system`
- [x] 2.2 Dates to the report's closing day unless the owner names another
- [x] 2.3 Recording a second time replaces the figure; no report ever has two
- [x] 2.4 Correcting and removing it
- [x] 2.5 Zero is a recorded cost; absent is not

## 3. Who may

- [x] 3.1 Recording, correcting and removing require the owner
- [x] 3.2 A manager and maintenance still READ the figure on reports they can read
- [x] 3.3 Writing expenses becomes owner-only — create, update, delete, vacancy electricity
- [x] 3.4 A manager still reads expenses within their buildings; maintenance reaches none

## 4. Reading it back

- [x] 4.1 A report reports its cost, and whether it has one
- [x] 4.2 The revenue report is NOT touched — confirm the figure arrives by existing behaviour

## 5. The screens

- [x] 5.1 A cost control on the damage report, owner only, saying the cost is the owner's
- [x] 5.2 A report with no cost says so rather than showing nothing
- [x] 5.3 The figure shown to every role that can read the report
- [x] 5.4 The expenses screen draws no write controls for a manager, and no empty containers

## 6. Strings

- [x] 6.1 New Vietnamese strings reported for review

## 7. Checks

- [x] 7.1 `tsc --noEmit`, `codes:check`, `atomic:check`, frontend lint and build
- [x] 7.2 As the OWNER: cost a repair, then read the month's revenue and see the net figure fall by exactly that amount
- [x] 7.3 Record twice — one expense, updated, never two
- [x] 7.4 As a MANAGER: no write control on expenses, no cost control on a report, every figure still readable
- [x] 7.5 As MAINTENANCE: the cost is readable on its own buildings' reports, and recording one is refused
- [x] 7.6 In a visible browser — 1440px and 390px
