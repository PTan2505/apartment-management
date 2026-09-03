# Tasks

## 1. The route

- [x] 1.1 Mount the portal at `/portal`, outside AuthProvider entirely — not merely outside the sign-in guard. AuthProvider asks who is signed in on mount, and for a tenant that costs a refused request and a refused renewal before a bill appears.
- [x] 1.2 A plain route. Loading on demand was built and measured at 482 KB against 910, then removed on request — the machinery was judged not worth the difference for a page opened a few times a month. Recorded in design.md with its price.
- [x] 1.3 Keep the portal's own API module. The owner's client renews a session on refusal and a tenant has none; that reason survives the merge and is met by not sharing the client, not by not sharing an application.
- [x] 1.4 Point it at the application's API address and drop the second one. Two settings naming the same API must agree, and nothing notices when they do not.

## 2. Removing the second build

- [x] 2.1 Delete the portal's Vite config, its HTML entry, its own React root, and its example env file.
- [x] 2.2 Remove its build and dev scripts.
- [x] 2.3 Remove its CI step.
- [x] 2.4 Leave nothing behind that can still produce a second bundle — one that nothing deploys and nobody checks is worse than none.

## 3. Verification

- [x] 3.1 Typecheck and build.
- [x] 3.2 **The owner's bundle does not contain the portal's code** — checked by looking for it, not by assuming the split worked.
- [x] 3.3 Superseded: one bundle by design now, so there are no chunks to keep apart. The cost is measured in design.md instead.
- [x] 3.4 A tenant link opens the portal without a sign-in screen, and the token still leaves the address bar.
- [x] 3.5 Bills, charges, meter readings and totals read exactly as before.
- [x] 3.6 An invalid token still says the link has expired, and nothing tries to renew a session.
- [x] 3.7 **The owner's application is unaffected**: sign in, and a reload still keeps the session.
- [x] 3.8 Nothing in the repository can still build a second bundle.
- [x] 3.9 Remove the verification data.
