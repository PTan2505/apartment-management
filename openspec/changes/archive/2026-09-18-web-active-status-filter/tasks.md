## 1. Backend

- [x] 1.1 Buildings: `status` replaces `includeInactive` on the list and locations queries; one `inServiceWhere` mapping shared by both; unknown value answers 400 (QUERY_INVALID)
- [x] 1.2 Rooms: the same on the list query, importing that mapping rather than restating it
- [x] 1.3 No `includeInactive` left in either module — service fees keep their own, untouched

## 2. Frontend

- [x] 2.1 Params and API layer send `status`, omitting it when it equals the API's own default; `includeInactive` gone from buildings and rooms types
- [x] 2.2 Buildings screen: a "Trạng thái" dropdown — Tất cả (default), Đang hoạt động, Đang ngưng hoạt động — in place of the switch, kept in the page address, and passed to the locations query
- [x] 2.3 Rooms screen: the same dropdown, and the building picker beside it follows the same status
- [x] 2.4 The three callers that wanted everything ask for `status: 'all'` — the invoices and expenses room pickers and the expense form

## 3. Checks

- [x] 3.1 `tsc --noEmit` both sides, lint, both builds, `codes:check`, `atomic:check`

## 4. Verify against the running API

- [x] 4.1 Buildings: active 9, inactive 1, all 10 — each set holds only what it says and the parts add up
- [x] 4.2 Rooms: active 59, inactive 2, all 61, same checks
- [x] 4.3 Omitting the parameter returns exactly what `status=active` returns, on both endpoints
- [x] 4.4 Locations follow the status asked for, and the active and all sets genuinely differ (9 vs 10 buildings)

## 5. Verify in a visible browser

- [x] 5.1 Both screens open listing everything with the dropdown reading "Tất cả", and no `status` in the address
- [x] 5.2 Each option changes the rows to exactly what the API reports, and every row under "Đang ngưng hoạt động" carries that chip
- [x] 5.3 The choice is in the address, survives a reload, and returning to "Tất cả" removes it again
- [x] 5.4 390px: the dropdown fits the screen, opens, and filtering works without the page scrolling sideways

## 6. Found during verification

- [x] 6.1 Eight browser checks failed on a harness fault, not the screen. `Emulation.clearDeviceMetricsOverride` does not restore the viewport, so after a 390px pass the app stayed in its phone layout with the navigation drawer open, and that drawer's backdrop swallowed every click. The driver now sets the desktop size explicitly and verifies it through `innerWidth`
- [x] 6.2 The remaining failures were also mine: MUI anchors an open Select so the CHOSEN option sits over the field, which puts the other options above the top of the window — the click by coordinate landed outside. The helper now scrolls the option into view and reports when it is off-screen instead of silently missing
