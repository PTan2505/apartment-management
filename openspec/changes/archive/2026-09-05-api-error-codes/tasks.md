## 1. The mechanism

- [x] 1.1 Make the code a constructor argument on every `AppError` subclass, keeping the status a property of the class — what varies per throw site is the situation, which the caller knows and the class does not
- [x] 1.2 Keep `AppError` rejecting a code that is empty or not in `SCREAMING_SNAKE`, so a typo is caught where it is written rather than reaching a screen
- [x] 1.3 Confirm `tsc` now fails on every un-migrated throw site — the compiler is what makes this a finite job rather than a search

## 2. Naming the situations, module by module

Each step: name the codes, compile, and exercise that module's endpoints with `curl` — including the failure paths, which is the whole point here.

- [x] 2.1 `middleware` (9) and `lib` (2) — the failures that happen before any route runs
- [x] 2.2 `auth` (7) — includes the credential rejection the owner meets on the first screen
- [x] 2.3 `buildings` (6), `rooms` (8), `customers` (6)
- [x] 2.4 `leases` (51) — the largest by far; split across sittings if needed
- [x] 2.5 `invoices` (23), `payments` (4), `deposits` (14)
- [x] 2.6 `service-fees` (17), `expenses` (16)
- [x] 2.7 `addresses` (8), `payment-gateway` (11), `tenant-portal` (7), `reports` (2)
- [x] 2.8 Confirm no two situations that would be phrased differently share a code, and no code is used at two unrelated throw sites

## 3. Carrying the union to the frontend

- [x] 3.1 Write a generator that collects every code from the backend source and emits the union type into the frontend
- [x] 3.2 Run it, and replace the hand-written `ApiErrorCode` union in `lib/api-error.ts` with the generated one
- [x] 3.3 Add a CI step that regenerates and fails if the checked-in file differs, so the two sides cannot drift through someone forgetting to run it
- [x] 3.4 Update `features/addresses/hooks.ts`, the one place branching on a code today

## 4. The Vietnamese dictionary

- [x] 4.1 Type it `Record<ApiErrorCode, string>` so a code with no phrase does not compile
- [x] 4.2 Write a phrase for every code, grouped by domain so a reader can find the section they are working in
- [x] 4.3 Add the by-status fallback for a code the dictionary has never seen — Vietnamese, never the API's message and never the raw code
- [x] 4.4 Route every place that currently shows `error.message` through the dictionary: the login screen, every list screen's error alert, every dialog
- [x] 4.5 Check the transport failure path still reads as a connection problem rather than a rejection

## 5. Verification

- [x] 5.1 `tsc --noEmit` and `npm run lint` pass in both packages
- [x] 5.2 Delete a phrase from the dictionary and confirm the build fails; restore it
- [x] 5.3 Change a code in the backend without regenerating and confirm CI's drift check fails; restore it
- [x] 5.4 `curl` the failure paths named in section 2 and confirm each answers with its own code
- [x] 5.5 In a real browser: sign in with a wrong password and read the message — it must be Vietnamese, which is the failure that started this
- [x] 5.6 In a real browser: provoke a rejection on a list screen and on a dialog, and confirm both read as Vietnamese
- [x] 5.7 Point the frontend at a code the dictionary does not know, and confirm the fallback is Vietnamese rather than English or an identifier
