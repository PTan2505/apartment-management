## Why

The theme now carries the new design system, so every screen changed colour and
typeface at once. What the theme cannot do is decide where a screen puts its
content. Looking at the running application afterwards, the screens disagree:

- **Doanh thu** wraps its figures and table in a white card. It reads as finished.
- **Hoá đơn**, **Toà nhà**, **Phòng** leave their filters and tables sitting
  directly on the page ground. They read as unfinished — the same components,
  drawn correctly, with nothing holding them.

That difference is not a matter of taste between two screens. It is the absence
of a rule. Nothing anywhere records that a screen's content belongs on a
surface, so each screen answered the question separately and two of the answers
disagree — and the next screen anyone writes will answer it a third way.

This change does the invoice list, and writes the rule down.

The invoice list goes first for a specific reason: it is the screen the design
system was built on, and the densest thing in the product. A surface treatment
that works there works everywhere; one that only works on a screen with four
figures on it proves nothing.

## What Changes

Scope is the invoice **list** screen (`/invoices`). The billing run and the
invoice detail screen are the same area of the product but different screens,
and they are not in this change.

- The filter row and the results table sit on one defined surface instead of
  directly on the page ground, matching the treatment Doanh thu already uses.
- Table density, header treatment, and the alignment of money move into the
  theme where they apply to every table, rather than being set on this screen.
- Payment status is a pill, sized so that it never wraps. The design's own mock
  shows this column too narrow, with "Đã thu đủ" broken across three lines; the
  screen takes the treatment from the design and not that flaw.
- The row under the pointer is marked, using the accent tint the design shows on
  its selected row. Marking a KEYBOARD-focused row is not included: the rows are
  not reachable by keyboard today, and making them so is the design's keyboard
  navigation, which is deferred with the rest of it.
- The status filter's "all" option currently reads `All`. It becomes Vietnamese.
  This is not part of the redesign; it is an existing violation of
  `web-infrastructure`'s requirement that every string the owner reads is in
  Vietnamese, on the screen this change is already opening.
- The empty state ("Chưa có hoá đơn nào") sits on the same surface as the table
  it replaces, rather than floating in the middle of the page.

### Deliberately not in this change

The design for this screen proposes considerably more than a restyle. Each item
below is a real idea worth doing and none of them is a visual decision, so
taking them here would turn a change that can be reviewed by looking at the
screen into one that cannot.

Needs the API first — and cannot be worked around in the browser:

- A search field, "Tìm theo tên hoặc số phòng". `listInvoicesQuery` accepts
  building, room, year, month and payment status, and nothing else.
- The four totals across the top. The list returns no aggregate, and summing the
  rows on screen would give the total of one PAGE, which stops being the answer
  the moment there is a second page. A wrong total is worse than none.
- Four of the design's seven columns. `Invoice` carries `leaseId` and
  `totalAmount`; it carries no room code, no tenant name, and no split of what
  has been collected against what is still owed. The room and the tenant are a
  join the API does not currently make. The two amounts could be added up from
  the `payments` array on the row, and should not be: which payments count, and
  what a reversal or a deposit deduction does to the figure, is a rule the
  backend already implements once, and a second copy in the browser would be the
  one that drifts.

  So the table keeps its four columns here. Widening it is an API change.

Changes behaviour, so it modifies `web-invoices` requirements:

- Opening a bill in a panel beside the list rather than navigating to its own
  screen.
- Keyboard selection (`↑ ↓`, `Enter`, `Esc`).
- Exporting, sending over Zalo, printing a receipt — three actions that do not
  exist.
- Creating a bill by hand, which was deliberately excluded when these screens
  were first specified.

Taken from the design and NOT followed:

- Its navigation lists six destinations and is missing Khách and Chi phí, while
  adding a dashboard and a meter-readings screen. That is a different product,
  not a restyle of this one.
- It names the product "AnGia Quản Lý". Invented.
- It writes amounts with `đ`, the letter. The application already writes `₫`,
  the đồng sign, and following the design here would be a regression.

Also noted while looking, and belonging to their own changes: the navigation's
active row runs to the drawer's edge so its corner radius never shows; and Toà
nhà uses emoji (⚡ 💧) as icons and contains one untranslated string,
`/ person`.

## Capabilities

### New Capabilities

None. This adds no capability; it constrains how existing ones are drawn.

### Modified Capabilities

- `web-infrastructure`: gains a requirement that the application draws itself
  from one design system — colour, typeface, corner radius and table density
  defined once and read by every screen, rather than chosen per screen. This
  capability already carries the product's other cross-screen presentation
  rules (the interface is in Vietnamese, dates read as a Vietnamese reader
  expects), and this is the same kind of rule.

`web-invoices` is deliberately NOT modified. Every requirement it states —
filtering, recording a payment, reversing one, withdrawing a bill, adapting to
the viewport — describes what the owner can do, and this change alters none of
it. A restyle that changed one of those would be a different and larger change
than the one proposed.

## Impact

- `frontend/src/features/invoices/InvoicesPage.tsx` — the screen itself.
- `frontend/src/app/theme.ts` — table defaults, so the treatment applies to
  every table rather than this one.
- No API change, no query change, no change to what any endpoint returns.

The design for this screen exists and settles the questions this change needed
it to settle: the filters and the table share one surface, the table is dense
with the room code carrying the row, and status reads as a pill.
