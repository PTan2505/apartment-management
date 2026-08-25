## Why

The owner application is written in English and its owner is Vietnamese. That was tolerable while the screens were being built and read mostly by whoever built them; it is not tolerable now that the application is complete and about to be used to run a real business.

The cost is not politeness, it is comprehension of the numbers. This came up concretely: reading the revenue screen's figures, the owner could not tell `settled` from `received` from `billed` — and those three are the whole point of that screen. Two of them are keyed on the month an invoice was issued and one on the month money arrived, and an English financial term that a reader has to translate before they can compare it is a term they will compare wrongly.

There is a second reason to do it as one change rather than screen by screen. The same idea appears on six screens — a tenancy, a bill, a deposit, a reading — and translated file by file it will acquire six names. A reader who meets *"hợp đồng"* on one screen and *"hợp đồng thuê"* on another has to work out whether they are the same thing. So the vocabulary is decided once and applied everywhere, in one pass.

## What Changes

- **Every string an owner reads becomes Vietnamese** — labels, buttons, headings, helper text, empty states, error messages, confirmation dialogs, and the navigation.
- **A single glossary decides the domain vocabulary**, and every screen uses it. This is the part that matters more than the translation itself: the words for a tenancy, a bill, a deposit, a meter reading and a cost are fixed once.
- **The revenue figures are renamed to say what they count**, which was the complaint that started this. Not a literal translation — `settled` rendered literally stays as unclear in Vietnamese as it was in English. Each figure is named for the question it answers, and the accrual figures are visibly separated from the cash one.
- **Dates are formatted the way a Vietnamese reader expects.** They already use `dd/mm/yyyy`; month names now come out in Vietnamese rather than as `August 2026`.
- **Strings stay inline**, matching the tenant portal, which is already Vietnamese and hardcoded. No translation library and no second language — nobody has asked for one, and an i18n layer for a single language is machinery with no purpose.

Deliberately NOT in this change:

- **Any behaviour change.** Every screen does exactly what it did. A change that translates and also adjusts is one where a broken screen has two possible causes.
- **The tenant portal**, which is already Vietnamese.
- **Backend messages.** The API's error text is English and reaches the screen in some failure paths. Translating it means deciding whether the API is a Vietnamese-speaking product or a neutral one, and that is a larger question than this change — the screens that can phrase their own message already do.

## Capabilities

### Modified Capabilities

- `web-infrastructure`: the application presents itself in Vietnamese, using one agreed vocabulary for its domain terms.
- `web-revenue-report`: the figures are named for the questions they answer rather than by their accounting labels.

## Impact

- `frontend/src/features/**`, `frontend/src/layouts/**`, `frontend/src/components/**`, `frontend/src/app/navigation.ts` — the strings.
- `frontend/src/lib/format.ts` and the date helpers — Vietnamese month names.
- No API change. No change to what any screen does.
