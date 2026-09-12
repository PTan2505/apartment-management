## Context

`OccupantsCard` renders the billed count under the heading "Tính tiền cho", with a caption keeping it apart from the list of people below. `EditTermsDialog` already edits `occupantCount` alongside the duration and the agreement terms, through `useUpdateLease` and `PATCH /leases/:id`, whose schema is partial — a body carrying only `occupantCount` is valid.

## Goals / Non-Goals

**Goals.** One button beside the figure, one field in the dialog, the same update path.

**Non-Goals.** No change to billing, to the API, to the relationship between the count and the occupant list, or to `EditTermsDialog`.

## Decisions

**A dedicated one-field dialog, not `EditTermsDialog` opened from a second place.** That dialog opens with focus on the duration and carries six fields. Reusing it would bring back exactly the problem this change removes: arriving to change one number and being handed several.

**Its own one-field schema.** The terms schema preprocesses optional fields and types its input and output apart; none of that applies to a single required integer, and sharing it would couple this dialog to fields it never shows.

**The body sends `occupantCount` only.** Sending the other terms back, even unchanged, would make this dialog a writer of values it did not display.

**Shown only while `lease.status === 'active'`**, the same condition the card already uses for "Thêm người". The API refuses updates to ended and cancelled tenancies.

**The button is an icon button with an accessible name**, placed on the same line as the figure. A text button would compete with "Thêm người" and "Chuyển người đứng tên", which act on people, not on the count.

**Strings.** New: the button's accessible name and tooltip, and the dialog title — proposed as "Sửa số người tính tiền". The field reuses the existing label "Tính cho" and the existing helper "Số người, dùng tính điện nước. Hoá đơn đã xuất vẫn giữ số người lúc xuất." from `EditTermsDialog`, so the same field reads the same in both places.

**Three strings corrected, on the owner's instruction.** The card's caption and the helper under "Tính cho" in both the signing form and the terms dialog said the count is used for electricity AND water. The code charges only WATER per person (`billing.ts`: water rate × count; electricity rate × kWh from the meter). An owner reading "điện nước" would expect raising the count to raise the electricity bill, and would be wrong. Raised under the rule on existing Vietnamese strings, and changed only after the owner said to. The fourth "điện nước" in the frontend — vacancy utilities belonging to a tenant's invoice — is about something else and stays.

## Risks / Trade-offs

**Two entry points to one value.** Both write the same field through the same endpoint and both read the lease back afterwards, so they cannot disagree. Accepted in exchange for leaving `EditTermsDialog` untouched.

**An owner may read the button as syncing the count to the list.** The card's caption directly above the button already says the count is kept apart from the list and the two may differ, and the dialog's helper says issued invoices keep their count. No new sentence is written for the dialog: the card's caption refers to "danh sách bên dưới", which would not make sense inside a dialog, and inventing copy was not asked for.
