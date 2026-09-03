# Tasks

## 1. Configuration

- [x] 1.1 A list of allowed browser origins, and a cross-site cookie switch. Both validated by the fail-fast env schema and mirrored in `.env.example`.
- [x] 1.2 Default the switch OFF, so `SameSite` stays `Strict`. It is the safer value and the correct one for a same-site deployment.
- [x] 1.3 **Refuse to start with cross-site cookies but no secure delivery.** Browsers discard that cookie silently, so tolerating it produces a login that appears to work and cannot be renewed, with nothing reporting a cause.

## 2. CORS

- [x] 2.1 Allow only the configured origins, with credentials. A wildcard origin cannot carry credentials at all — which is why fixing SameSite alone would leave sign-in broken.
- [x] 2.2 Accept several origins: the owner's application and the tenant portal are deployed separately.
- [x] 2.3 Keep the permissive branch when nothing is configured, so local development is untouched.

## 3. The cookie

- [x] 3.1 Take `SameSite` from configuration, leaving `httpOnly` and the path scope alone.
- [x] 3.2 `tsc --noEmit`.

## 4. Verification

- [x] 4.1 **Default config behaves exactly as today**: sign in, refresh, log out, and the cookie still carries `SameSite=Strict; HttpOnly; Path=/auth`.
- [x] 4.2 With origins configured, a request from an allowed origin is granted access and credentials.
- [x] 4.3 A request from an origin that is not on the list is not granted access.
- [x] 4.4 With no origins configured, any origin is still accepted.
- [x] 4.5 **Cross-site cookies without secure delivery refuses to start**, and says why.
- [x] 4.6 With cross-site cookies and secure delivery, the cookie carries `SameSite=None; Secure`.
- [x] 4.7 **Nothing else changed**: the portal still authenticates by header, and every other endpoint behaves as before.
