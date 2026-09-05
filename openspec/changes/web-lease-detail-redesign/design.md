## Context

See proposal.md — Why.

The screen today is `LeaseDetailPage.tsx` holding three sibling cards: a terms card written inline in the page, plus `OccupantsCard` and `ContractCard`. All of the data comes from one `Lease` object, and the page performs no computation over it beyond formatting.

Two constraints shape everything below, both set by the owner:

1. **Presentation only.** No change to `api.ts`, to any hook, to any request, or to any data shape. Every mutation and dialog keeps the behaviour it has.
2. **Nothing may be invented.** The design shows ten fields the API does not report. They are enumerated in the proposal and are not to be filled in with defaults, placeholders or browser-side derivations.

The second constraint is the one that decides the layout, so it is worth being exact about what remains. From `Lease`: `room`, `tenant` (name and phone), `status`, `baseRent`, `depositAmount`, `depositMonths`, `durationMonths`, `startDate`, `expectedEndDate`, `moveOutDate`, `cancelledAt`, `occupantCount`, `hasContract`, `contractStorageAvailable`, `createdAt`. Remaining time is a computation over dates already present, not a new field.

## Goals

- A header band that answers identity, state and remaining time without the reader descending a list.
- Terms ordered by what a tenancy is argued about, with the labels the owner approved.
- A billing panel built from `useInvoices({ leaseId })`, which exists.
- Both layouts, since this project has one breakpoint and two of them.

## Non-Goals

- Any backend work. The missing fields are named in the proposal and left for a separate change.
- The sidebar. The design renames five navigation items and the product itself; that is a different screen and a decision the owner has not made.
- Reworking `OccupantsCard`, `EditTermsDialog`, `CancelLeaseDialog`, `TransferPrimaryDialog`, or the departure flow.

## Decisions

### The remaining time is computed here, and it is a presentation of dates the page already has

`Còn 11 tháng 14 ngày` is not a field. It is `expectedEndDate` minus today, and `expectedEndDate` is already on the object — the page already imports `coveredThrough` from `dates.ts` to render its dates correctly.

This is deliberately NOT the "assemble it in the browser" case CLAUDE.md warns about. That rule is about a browser holding a second copy of a RULE the server owns — which rate applies, whether a lease may be cancelled. A duration between two dates is arithmetic over data already delivered, with no server-side counterpart to disagree with. `cancellable` stays exactly where it is, on the API, for precisely the opposite reason.

The alternative — asking the API for a formatted remaining-time string — would put a presentation decision on the server and make the phrasing untranslatable without a deployment.

**A tenancy that is not running gets no remaining time at all.** A negative or zero duration rendered as `Còn 0 tháng` states something false about a tenancy that ended in March. The header reports the ending instead.

### The billing panel reads the invoice list, and says when it is showing part of it

`useInvoices({ leaseId, pageSize })` returns a page and its meta, which already carries the total. So the panel can state "N invoices" truthfully while listing fewer, and the outstanding balance is summed over what it lists.

That last point is a real limitation and must be stated rather than hidden: **a balance computed from one page is a balance over that page.** Two honest ways out — request a page large enough to cover any realistic tenancy (a twelve-month tenancy has at most a few dozen invoices), or label the figure by what it covers. This design takes the first, with a page size well above any plausible count, and treats the "more history than shown" case in the spec as the guard for when it is not enough. Silently summing a partial page into a figure labelled "Dư nợ" is the one option ruled out.

### The panel is a new file, not more page

`LeaseDetailPage.tsx` is already the assembly point for three cards. The invoice panel is a fourth, with its own query, its own loading and empty states, and its own failure. Inlining it would put a second data source inside a component whose current job is to lay out one. It goes in `features/leases/LeaseInvoicesPanel.tsx`, beside `ContractCard`, and takes the lease as its prop.

It lives under `leases/` rather than `invoices/` because it exists to answer a question about a tenancy. Its dependency runs one way: the leases feature reads the invoices feature's hook, which is the direction that already holds.

### The labels change, and only the four the owner approved

`Giá thuê` → `Tiền thuê hàng tháng`, `Tiền cọc` → `Tiền cọc đảm bảo`, `Bắt đầu` → `Ngày bắt đầu hiệu lực`, `Thoả thuận đến hết` → `Ngày kết thúc thoả thuận`.

Untouched: `Thời hạn`, `Ngày huỷ`, `Thực tế đến hết`, `Dự kiến bắt đầu`, `Không tìm thấy hợp đồng`, and every string in the dialogs and the contract card. The design does not propose alternatives for these, and a label changed because it happened to be nearby is a change nobody asked for.

### Two layouts, not one that shrinks

Desktop is two columns — terms and contract on the left, billing on the right — matching the design. On a phone a two-column split becomes two very narrow columns, so the panels stack, with billing last: on a small screen the terms are what was opened for, and the billing history is what is scrolled to.

## Risks / Trade-offs

- **The balance is summed in the browser over one page.** → A page size far above any realistic invoice count, plus the spec's requirement to offer the full history rather than present a partial list as complete. The proper fix is an API that reports the balance; it is named in the proposal.
- **A second query means a second thing that can fail.** → The panel owns its loading, empty and error states, and its failure does not take the terms down with it. An owner who opened this screen to read a clause can still read it while the billing panel is retrying.
- **`occupantCount` disappearing from a redesigned terms card would be a silent regression.** → It stays, and it stays distinct from the occupant records, which `OccupantsCard` already presents as a different question.
- **The four renamed labels are the kind of change nobody notices until a user does.** → They were confirmed explicitly with the owner before being written down here.

## Migration Plan

None. Presentational, no persisted state, no data shape touched. Reverting is reverting the commit.

## Open Questions

None. The ten unreported fields were raised with the owner before this document was written, and the decision — build what the API supports, name the rest for a separate change — is recorded in the proposal.
