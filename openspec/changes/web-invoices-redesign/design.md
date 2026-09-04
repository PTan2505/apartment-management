## Context

See proposal.md — Why. What matters here is the shape of the existing screen,
because it constrains every decision below.

`InvoicesPage` renders filters, then `InvoiceList`, which renders **two
different things at two widths**: a `TableContainer` above `md`, and one
`<Card variant="outlined">` per invoice below it. That is the responsive
strategy the whole application uses, and `web-invoices` already requires it
("The billing screens adapt to the viewport").

The design supplied covers the desktop form only. There is no mobile mock.

## Goals / Non-Goals

**Goals**

- The screen's content reads as sitting on something, at both widths.
- The appearance of that surface is decided once, not on this screen.

**Non-Goals**

- Any new abstraction for laying out screens. See the decision below.
- Deciding anything about the mobile form beyond not breaking it. The design did
  not cover it, and inventing a mobile treatment from a desktop mock is how a
  restyle turns into a redesign nobody reviewed.

## Decisions

### The surface is a `Paper`, and no new component is introduced

The obvious alternative is a shared `<ScreenSurface>` wrapper, and it is
tempting because the spec's rule applies to every screen.

Rejected, for now. What has to be consistent is the *appearance* — radius,
border, ground — and the theme already carries all of it: `MuiPaper` is set to
`elevation: 0` with a 12px radius. What stays local is the structural question
of whether a given screen has one surface, two, or none, and that genuinely
differs per screen: Doanh thu has one card per building, Chi tiết hợp đồng has
several. A wrapper component would centralise the part that is already
centralised and add indirection to the part that is not.

If a third screen turns out to repeat more than `<Paper variant="outlined">`,
that is the moment to extract something — with three examples to design it
from rather than one.

### The ground stays cool slate, not the warm cream in this mock

The two Stitch outputs disagree. The design-system board sets its cards on a
cool, slightly violet ground; this screen's mock uses a warm cream.

The board wins, on a rule worth stating because it will come up again: **a
value the design NAMED beats a value read off pixels.** The board stated four
hex values, three of which are Tailwind slate-ramp colours, and the theme's
greys were derived from that ramp. The cream here is unstated — it may be a
deliberate second thought, or it may be what the model happened to render. There
is no way to tell from the image, and guessing wrong means every screen built
afterwards inherits the guess.

If the cream was deliberate, it is one line in `theme.ts` to change, and
changing it there changes every screen at once. That is the whole reason the
palette lives in one place.

### The status column stops wrapping, contradicting the mock

In the mock, `TÌNH TRẠNG` is too narrow: "Đã thu đủ" breaks across three lines
and "Thu một phần" across two. A pill that wraps is not a pill.

The screen takes the treatment — a pill — and not the width. The column gets
enough room for the longest Vietnamese status, and the pill itself refuses to
wrap. This is the one place the implementation deliberately departs from the
image, and it is recorded here so the departure is not later read as an
oversight.

### The mobile form keeps its cards and gains no outer surface

Wrapping `InvoiceList` in a `Paper` unconditionally would put the mobile card
list inside a card — a border around a stack of borders, which reads as a
mistake rather than as structure.

The surface therefore belongs to the desktop table, at the same breakpoint the
list already switches on. Below `md`, the per-invoice cards *are* the surface,
which satisfies the spec's requirement without a second frame around them.

## Risks / Trade-offs

**The filters and the table sharing one surface makes the surface tall on a
screen with many rows** → Accepted. It is what the design shows, and it is the
grouping the screen means: the filters describe the table beneath them, and
separating them into two cards would say they are two unrelated things.

**Setting table density in the theme changes every table in the application at
once, including screens not reviewed in this change** → This is the point, and
also the risk. Mitigated by the verification step: the other list screens are
opened and looked at before the change is considered done, not only the invoice
screen. A density that only suits invoices is the wrong density.

**The cool/warm ground decision could be wrong** → Cheap to reverse, one token
in `theme.ts`, and reversing it corrects every screen simultaneously. This is
the failure mode the theme exists to make cheap.

## Open Questions

None that block. Whether the warm ground was deliberate is answerable later by
asking for the design system board to be regenerated, and the answer changes one
value rather than any requirement, approach, or task below.
