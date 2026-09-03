# Tasks

## 1. One implementation

- [x] 1.1 Move the charge labelling to `lib/`, where both surfaces can take it without either owning it. The portal is not an owner feature and should not import from one.
- [x] 1.2 Point the owner's invoice screen at its new home.
- [x] 1.3 Do NOT copy it. A tenant querying a bill against the owner's screen is exactly when two descriptions of one charge would surface — as an argument about whether the bill is right.

## 2. The portal

- [x] 2.1 Use the label as each charge's heading, replacing the kind-to-word map.
- [x] 2.2 Drop the stored English description from the caption; keep the basis and the period, which are numbers and dates.
- [x] 2.3 An owner-written charge shows the owner's words as the heading, not demoted beneath a category.
- [x] 2.4 Typecheck and build both entries — the portal has its own Vite config and is not covered by the main build.

## 3. Verification

- [x] 3.1 A monthly bill in the portal: rent, electricity and water named in Vietnamese, with basis and period intact.
- [x] 3.2 **The same bill, owner screen and portal, name each charge identically.**
- [x] 3.3 A bill carrying an owner-written charge shows their sentence as the heading.
- [x] 3.4 A move-in bill's deposit line is named with its months.
- [x] 3.5 **The figures and the total are unchanged**, checked against what the API returned.
- [x] 3.6 Meter readings and the rate are still shown.
- [x] 3.7 On a phone-width viewport.
- [x] 3.8 Remove the verification data.
