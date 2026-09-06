## 1. Refuse the configuration that cannot work

- [x] 1.1 Add a cross-field refinement in `env.ts`, beside the two already there, refusing production with no `WEB_ORIGINS`
- [x] 1.2 Make the message say WHY, not only what: naming the setting alone sends a reader to try a wildcard, which is where they came in
- [x] 1.3 Leave `CROSS_SITE_COOKIES` alone — a separate setting with its own rule

## 2. Make the unconfigured case work outside production

- [x] 2.1 Reflect the requesting origin with credentials when nothing is configured, instead of a wildcard that a browser will not send credentials to
- [x] 2.2 Keep a configured deployment behaving exactly as it does today
- [x] 2.3 Replace the comments in `server.ts` and `env.ts` that describe the empty value as "any origin" — they describe a permission that permits nothing

## 3. The documented starting point

- [x] 3.1 Stop shipping `WEB_ORIGINS=` empty in `.env.example` as though it were a working configuration
- [x] 3.2 Say what it is for and that a deployment needs it, with a real-shaped example

## 4. Verification

- [x] 4.1 `tsc --noEmit` passes and `npm run codes:check` still matches
- [x] 4.2 Start with `NODE_ENV=production` and no `WEB_ORIGINS`: the process must refuse, and the message must name the setting and the consequence
- [x] 4.3 Start with `NODE_ENV=production` and an origin set: the process must start
- [x] 4.4 Start in development with nothing set: the process must start
- [x] 4.5 `curl` a preflight from an unconfigured development server and confirm the response echoes the origin and allows credentials — NOT a wildcard
- [x] 4.6 `curl` a preflight against a configured server from an origin NOT on the list, and confirm it is not granted access
- [x] 4.7 The check that started this: serve a REAL production build of the front end against a development API with nothing configured, and sign in through the form in a visible browser. It must succeed — this is the exact case that failed before, and `curl` cannot prove it because only a browser enforces CORS
- [x] 4.8 Confirm the existing dev-proxy path still works, since it is what everyday local work uses
