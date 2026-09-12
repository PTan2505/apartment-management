## Context

Five columns exist on `Lease` and reach the frontend already: `reference`, `noticeDays`, `paymentDay`, `startWaterReading`, `handoverSignedAt`. The frontend's `Lease` type does not declare them, so they arrive and are dropped.

`TermsCard` on the detail screen is already two groups separated by a divider: money first, then dates. `EditTermsDialog` currently edits `durationMonths` and `occupantCount`; the update endpoint accepts those plus all four recordable terms through the same `agreementTermFields` spread.

## Goals / Non-Goals

**Goals.** Show the five terms. Let the four recordable ones be entered. Keep the reference read-only.

**Non-Goals.** No change to the signing form. No backend change. No new validation beyond what the API already enforces.

## Decisions

**A third group in `TermsCard`, not a new card.** These are terms of the same agreement as the rent and the dates above them. A separate card would say they are a different kind of fact, and the screen already has four cards.

**"Chưa ghi nhận" for a missing term, not an omitted row.** The alternative — hide what is null — cannot distinguish a tenancy where nobody agreed a notice period from one where the screen chose not to show it. It also makes the card's shape depend on the data, so two tenancies side by side have different rows and the owner cannot tell why.

**The reference reads as text, not as a field.** It is generated, unique, and never accepted from a caller. Rendering it in the edit dialog as a disabled input would imply it is a value that could be edited if something were unlocked.

**Empty input means "leave as it is", not "clear it".** The dialog sends only what was typed. The API treats every term as `.optional()` and cannot express "set this back to null", so a blank field cannot mean "clear" without inventing a convention the API does not have. Clearing a recorded term is not offered rather than offered and silently ignored.

**The water reading is labelled as the opening one.** `startWaterReading` next to an electricity reading that the bills actually consume invites reading it as the current one. Water is billed per person here, so this number is a record of what the meter said at handover and nothing computes from it yet.

## Risks / Trade-offs

**Four rows of "Chưa ghi nhận" on every existing tenancy.** Accepted, and the reason the edit path is in this change rather than a later one: the state is visible and fixable in the same place.

**A payment day of 31 in a 30-day month.** Accepted deliberately, matching the API. The field records what the agreement says; what the biller does in February is a separate question this field must not pre-empt.
