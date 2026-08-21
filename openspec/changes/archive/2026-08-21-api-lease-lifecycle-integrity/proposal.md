## Why

Two gaps sit on either side of a room's tenancy history: one lets it be billed twice, the other hides a lease that has quietly stopped working.

**A room can hold two tenancies that cover the same days.** Creating a lease is refused only when another lease on that room has no move-out recorded. Nothing looks at the dates. So a tenancy recorded as ending 5 July, followed by a lease beginning 1 July, is accepted — and both are billed for 1–4 July, twice, with no warning. The one-active-lease rule was only ever an *overlap-with-an-open-lease* rule; it was never an overlap rule.

**A lease past its term with no move-out recorded is now stuck, and nothing surfaces it.** Billing that lease was refused deliberately: nobody has confirmed the tenant is still there, so charging beyond the term invents occupancy. The pressure is intended — the owner must record the departure or sign a renewal. But the room stays held by the one-active-lease rule while no invoice can be issued, and an owner has no way to find these leases short of checking each room. A rule that makes something stop working should also make it findable.

## What Changes

- **BREAKING (behaviour):** reject a lease whose start date falls before the end of the most recent tenancy on that room. A new lease may begin on exactly the date the previous one ended, and no earlier.
- Impose no other constraint on the start date. A tenancy may begin on any day of any month; only overlapping a previous one is refused.
- Let leases be filtered by whether their term has ended without a move-out being recorded, so an owner can find the ones that need closing or renewing.

Deliberately out of scope:

- **Requiring the previous lease to be closed.** Already enforced — a lease with no move-out already blocks a new one on that room. This change adds the date check the existing rule never made.
- **Gaps between tenancies.** A room may stand empty between leases, and a new lease beginning well after the last one ended is normal rather than suspect.
- **Repairing existing overlaps.** The check applies to leases created afterwards. Any overlap already recorded is history and correcting it is a data question, not a rule question.
- **A frontend for the filter.** The lease screen is its own change; this makes the data reachable.

## Capabilities

### Modified Capabilities

- `lease`: a lease may not begin before the previous tenancy on its room ended, and leases can be filtered by whether their term has run out without a move-out.

### New Capabilities

None.

## Impact

**Database.** None. No column changes, no migration — both facts are already recorded.

**Code.** One added check in lease creation, and one added filter on lease listing. Neither touches billing.

**Existing leases.** Untouched, including any that already overlap. The check governs creation.

**Behaviour that changes.** A lease that would overlap the previous tenancy is now refused where it was accepted. That is the correction: it was producing invoices that charged the same days twice.

**Downstream.** The overdue filter is what a lease screen will use to show the owner what needs attention, and the overlap check protects every billing change that follows from a class of double-charging it cannot detect on its own.
