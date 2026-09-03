# Tasks

## 1. The address

- [x] 1.1 Take an absolute API address from configuration, falling back to the relative path the dev proxy serves.
- [x] 1.2 Name it for what it is — the API's address — distinct from the proxy's forwarding target. One name meaning two things is what produced this bug.
- [x] 1.3 Refuse a PRODUCTION BUILD with no address. An application that will ask its own origin for the API fails only when somebody signs in, and reads as broken rather than unconfigured.
- [x] 1.4 Leave development alone: it has a working relative path and a proxy to serve it.
- [x] 1.5 Document it in `.env.example`.
- [x] 1.6 Typecheck and build.

## 2. Verification

- [x] 2.1 **Reproduce**: build with no address and confirm the bundle calls the app's own origin — which is the deployed failure.
- [x] 2.2 A production build with no address is refused, naming the setting.
- [x] 2.3 A build WITH an address puts that address in the bundle.
- [x] 2.4 **Development is unchanged**: the dev server still proxies, sign-in still works, and the refresh cookie still survives a reload.
- [x] 2.5 The portal build is unaffected — it has its own address setting and its own config.
