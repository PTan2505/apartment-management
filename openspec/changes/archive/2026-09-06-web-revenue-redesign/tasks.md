## 1. The four figures that lead

- [x] 1.1 Present billed, collected, outstanding and spent ahead of any table, from the totals the report already returns
- [x] 1.2 Give each its share, and name what the share is taken of
- [x] 1.3 Omit a share rather than render `NaN%` or `0%` when nothing was billed — the two are different claims and only one is true
- [x] 1.4 State the profit and the subtraction that produced it, using the `netBilled` the API reports rather than subtracting here
- [x] 1.5 Show a loss as a negative figure, plainly — not hidden, not clamped, not styled as an error

## 2. The chart

- [x] 2.1 Add `recharts`
- [x] 2.2 Put the chart in its own component under `features/reports/`, so it can be lazily loaded later without touching the page
- [x] 2.3 Chart `billed` against `settled` only — never `received`, which is keyed on a different thing and would make the axis lie
- [x] 2.4 State the period covered and the unit the figures are drawn in
- [x] 2.5 Withhold the chart below two months and say why, rather than drawing one bar that looks like a trend
- [x] 2.6 Label the series with the words already on the screen, and report the design's `Đã thu thực tế` rather than adopting it

## 3. The rest of the screen

- [x] 3.1 Give expense categories bars and shares beside their amounts, with the total stated
- [x] 3.2 Apply the design's typography and spacing to the month table and the per-building sections, keeping every figure they show
- [x] 3.3 Keep "Tiền thực nhận" in its own section, keep its explanation, and restyle only
- [x] 3.4 Leave the filters exactly as they are — a building, and a from–to range
- [x] 3.5 Confirm no field the report does not return has appeared: no room table, no room counts, no voucher count, no address, no freshness timestamp, no export

## 4. Layout

- [x] 4.1 Chart beside the category breakdown on desktop
- [x] 4.2 Stacked on a phone, chart first
- [x] 4.3 `tsc --noEmit` and `npm run lint` pass in both packages, and the production build still succeeds with the new dependency

## 5. Verification, in a visible browser

- [x] 5.1 Seed the local database if the range has no expenses in several categories, or no month with both paid and unpaid invoices — a screen verified empty is not verified
- [x] 5.2 Sign in from a signed-OUT browser, asserting the sign-in form is present before typing into it
- [x] 5.3 Desktop pass in a maximised window at the full width of the display, not an emulated viewport
- [x] 5.4 Filter by building and read the figures back, confirming they change and that a single building's total is not the all-buildings total
- [x] 5.5 Filter by month range and read the figures back
- [x] 5.6 Check one leading figure against the month rows beneath it rather than trusting the number
- [x] 5.7 Read the chart back from the DOM — the number of bars, and the series names — not from a screenshot of it
- [x] 5.8 Narrow the range to one month and confirm the chart is withheld with a reason
- [x] 5.9 Find or make a range with nothing billed, and confirm no `NaN%` reaches the screen
- [x] 5.10 Confirm "Tiền thực nhận" is still present, still separate, and still carries its explanation
- [x] 5.11 Click through to whatever the outstanding figure leads to, and read the resulting path back
- [x] 5.12 Mobile pass — 390px under emulation loaded fresh (card 358, chart 340, overflow 0) and a real 500px window, which is the narrowest macOS will make a Chrome window; scrolled the full 4806px with overflow measured at every position

## 6. Follow-ups the first pass left

- [x] 6.1 Render the owner-named charge breakdown as bars too — two presentations of one kind of data, a few lines apart, makes a reader look for a difference that is not there
- [x] 6.2 Take each breakdown's denominator from its own entries: expenses partition spending, charges partition what was billed, and a borrowed denominator gives shares that do not add to 100
- [x] 6.3 Load the chart and `recharts` only when this screen is opened, rather than on every page including sign-in
- [x] 6.4 Reserve the chart's height in the loading state so the page does not jump when it lands
- [x] 6.5 Verify the split against a REAL production build, not the dev server, which does not bundle and so cannot show it
- [x] 6.6 Seed owner-named charges first — the breakdown renders nothing when the data has none, and a section verified absent is not verified
