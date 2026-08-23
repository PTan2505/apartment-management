## Context

This is the first outbound call the system makes. Everything until now has been this API and its database.

The provider is OpenMap.vn, verified directly against a live key before this was written. What the verification established:

```
  auth        ?apikey=…   as a query parameter; the header form answers 401
  search      GET /v1/autocomplete  → predictions[]: description + place_id
                                      (terms are offsets into the description,
                                       not structured fields)
  resolve     GET /v1/place?ids=…&format=osm
                          → properties: housenumber, street, locality,
                                        county, region, country
```

And the decisive one, comparing the same place with the flag on and off:

```
  admin_v2=true                        admin_v2=false
  locality 'phường Thủ Đức'            locality 'phường Trường Thọ'   ← pre-merger
  county   ''                          county   'thành phố Thủ Đức'   ← abolished tier
  region   'thành phố Hồ Chí Minh'     region   'thành phố Hồ Chí Minh'
```

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Decide the provider's awkward parts once, on the server, so no client inherits them.
- Fail in a way that says what is wrong: unconfigured, unavailable, or a bad request are three different things.

**Non-Goals:**
- No caching. A search is typed once and resolved once; nothing repeats enough to cache.
- No abstraction over providers. There is one, and a second is not planned. The normalization already means swapping it would touch one module.
- No coordinates, no map. The provider returns them; nothing here needs them.

## Decisions

### Normalize on the server; the client never learns the provider exists

The response is this system's shape, not a passthrough:

```
  provider                     this API
  ────────                     ────────
  housenumber '12'        ─┐
  street 'Đường Nguyễn Huệ'─┴──► address 'Đường Nguyễn Huệ 12'
  locality 'phường Thủ Đức'  ──► ward    'Thủ Đức'
  county   ''                    (absent — the abolished tier)
  region 'thành phố Hồ Chí Minh'► city    'Hồ Chí Minh'
  country 'Việt Nam'         ──► country 'Việt Nam'
```

Three things hide behind that arrow, and each is a trap a client would otherwise have to know about: the `admin_v2` flag, the two-call sequence, and the prefixes. Getting `admin_v2` wrong is silent — the response looks entirely normal and describes wards that no longer exist.

The provider is also internally inconsistent. While verifying, a place whose own label read `tỉnh Đồng Nai` reported its region as `thành phố Đồng Nai`. Province and city are not interchangeable, and a client should not have to know which to believe.

### Prefixes are stripped, and stripping is conservative

Buildings record `Thủ Đức`, not `phường Thủ Đức`. Storing the prefixed form would put a second spelling of every place into the database, and the location filter would offer both — the exact duplication this feature exists to prevent.

Stripping removes a leading administrative designation only when it is followed by more name:

```
  'phường Thủ Đức'          → 'Thủ Đức'
  'xã Bù Đăng'              → 'Bù Đăng'
  'thành phố Hồ Chí Minh'   → 'Hồ Chí Minh'
  'tỉnh Đồng Nai'           → 'Đồng Nai'
```

The risk is a genuine name beginning with one of those words. Requiring a following space and a non-empty remainder makes that narrow, and the alternative — matching loosely — could truncate a real name. The cost of stripping too little is a duplicate entry in a dropdown; the cost of stripping too much is a wrong address.

What is lost is the `phường`/`xã` distinction, which says whether a ward is urban or rural. Nothing in this system uses it, and it is recoverable from the recorded place identifier.

### Failures are three different things, and say so

```
  no key configured        → the feature is not set up
  provider unreachable,
  slow, or rejects our key → the feature is unavailable
  empty or bad input       → 400, and the provider is never called
```

The middle case is the one worth being careful about. The provider rejecting *our* key must not surface as the *caller* being unauthenticated — the caller is fine; the system's own credential is not. Reporting 401 there would send a signed-in owner to a login screen for a fault they cannot fix.

All three use the standard error shape. That matters more than it looks: the frontend classifies a gateway status **without** an application error body as "the request never arrived". Since these carry a body, they are correctly read as this API answering, not as this API being down.

### The key is optional, and absence is a normal state

Requiring it would mean nobody can start the backend without first registering with the provider — a poor trade for a feature affecting one form. It is already declared optional in the env schema; this change is what reads it.

The key is passed as a query parameter because the provider's gateway rejects the header form. That is worth a comment where it happens, since a header is the obvious thing to try and it fails with a plausible-looking 401.

### `placeId` on the building, nullable, never backfilled

Recording which place an address came from makes a future re-resolution possible. Vietnam re-drew its administrative map once; if it happens again, a stored identifier is the difference between re-resolving every building and re-typing them.

Null means the address was typed by hand — which is true of the one existing building, so there is nothing to backfill. Null is also the right state after someone corrects an address manually: leaving a stale identifier would claim the address came from a place it no longer matches.

It is deliberately not a foreign key to anything, and nothing validates it. It is a note about provenance, not a reference.

## Risks / Trade-offs

- [The system now depends on a third party for a form to work fully] → contained by design: lookup is optional, its absence is a normal state, and the four address fields remain typeable. Nothing becomes unusable if the provider disappears.
- [Prefix stripping could shorten a genuine name that begins with an administrative word] → narrowed by requiring the designation to be a complete leading word with a non-empty remainder; the failure is visible in the form before saving, since the fields stay editable.
- [Stripping discards the `phường`/`xã` distinction] → nothing uses it, and the place identifier makes it recoverable. Recorded here so its loss is deliberate.
- [`admin_v2` is a provider-specific flag whose removal would silently return abolished units] → set in one place with the verification recorded above; a comment states what turning it off does.
- [An outbound call makes a request as slow as the provider] → a timeout bounds it, and the failure is reported as the feature being unavailable rather than hanging.
- [Storing `placeId` ties a record to a provider's identifier scheme] → accepted; it is nullable, unvalidated, and unused by anything else, so a provider change makes it stale rather than wrong.

## Migration Plan

One nullable column on `Building`, no backfill, no default. Deploy: `prisma migrate deploy`, then restart. The endpoints are additive and the building field is optional, so an older client keeps working throughout and there is no ordering requirement between backend and frontend.

Rollback: revert the migration together with the module. Any recorded `placeId` is lost, which costs only the ability to re-resolve those addresses automatically.
