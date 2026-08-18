## Context

`Building` holds `ward` and `city` as free text. Listing filters them with `contains` plus `mode: "insensitive"`, and the router already applies `authenticate` and `requireRole("owner")` to every building route.

Two properties of the database shape this design, both confirmed by direct query rather than assumed:

```
  datcollate = C   datctype = C   provider = libc

  lower('ĐỨC')                 →  'ĐỨc'     only the ASCII C folded
  'Đức' ILIKE '%đức%'          →  false
  ORDER BY city                →  … Hồ Chí Minh, Đà Nẵng   (Đ sorts last)
```

Case folding and collation-aware ordering are therefore both unavailable from the database as configured. See proposal.md for why that makes offering choices better than accepting free text.

## Goals / Non-Goals

**Goals:**
- Return values that can be used as filters verbatim, with no folding, normalisation, or round-tripping.
- Give a client enough to build a narrowed choice — pick a city, see only its wards — in one request.

**Non-Goals:**
- Not repairing the collation. That is a wider decision affecting every text search in the system.
- No reference data, no canonical spellings, no fuzzy grouping.
- No caching layer. The set is tiny and changes only when a building is created or edited.

## Decisions

### Grouped by city, not two flat lists

```
  flat                              grouped
  ────                              ───────
  { cities: [...],                  { locations: [
    wards:  [...] }                     { city, wards: [...] },
                                        …
  a ward cannot be traced              ] }
  back to its city, so a
  narrowed choice is impossible     one request, and the pairing
  without another request           is explicit
```

The same ward name can exist in more than one city, so two flat lists lose the information that makes a cascading choice correct. Grouping keeps it and costs nothing: the number of distinct pairs is bounded by the number of buildings, which is small by construction.

The alternative was a `?city=` parameter returning only that city's wards. That is one request per city change, for data that fits comfortably in the first response.

### Ordered in the service, not the database

The database cannot order this correctly as configured, and Prisma's `orderBy` cannot express a `COLLATE` clause — so ordering in SQL would mean dropping to a raw query and losing the typed result.

Node sorts it correctly instead:

```
  plain .sort()               An Giang | Cần Thơ | Hà Nội | Hồ Chí Minh | Đà Nẵng
  Intl.Collator('vi')         An Giang | Cần Thơ | Đà Nẵng | Hà Nội | Hồ Chí Minh
                                                   ↑ Đ in its alphabetical place
```

This is still ordering at the source — the API returns an ordered result and every consumer gets it — it simply happens in the service rather than the query. Verified in this project's Node version; `Intl.Collator('vi')` and the root locale give the same order for these values.

The set is small enough that sorting in memory is not a consideration. If it ever were, that is the moment to fix the collation properly rather than to optimise here.

### `distinct` on the pair, then group in memory

Prisma can select `distinct: ["city", "ward"]`, which pushes the deduplication into SQL and returns at most one row per pair. Grouping those rows by city is then a few lines, and keeps the query expressible in Prisma rather than raw SQL.

A `groupBy` would return counts nobody asked for. A raw `SELECT DISTINCT` would return the same rows with less type safety.

### `includeInactive` mirrors listing, deliberately

The parameter is named and typed exactly as on building listing, and means the same thing. A location offered as a filter choice must not produce an empty result — which is exactly what would happen if a retired building's city were offered while listing defaults to active only.

The two therefore have to agree. Sharing the parameter shape is what makes that agreement visible rather than incidental.

### Not paginated, and the spec says so

Every other collection endpoint in this system is paginated, and the shared contract is well established — so silence here would read as an oversight. The revenue report already set the precedent that a bounded summary is not a listing. Stating it in the spec stops a future change from "fixing" the inconsistency.

## Risks / Trade-offs

- [Two spellings of one place appear as two choices] → intended, and better than the alternative: a free-text search returns a partial list with no indication anything is missing, while two visible options can be seen and corrected.
- [Sorting in the service means the database's own ordering is unused, which could surprise someone reading the query] → the reason is recorded here and in a comment at the sort; the alternative is raw SQL for every location query.
- [The endpoint is a second thing to keep in step with listing's filter semantics] → contained by sharing the `includeInactive` shape, and by the scenario asserting that a returned value used as a filter finds its building.
- [Offering choices hides the case-folding defect rather than fixing it, so the next free-text search will rediscover it] → stated plainly in the proposal, with the evidence recorded above so the investigation does not have to be repeated.

## Migration Plan

No database change and no migration. The endpoint is additive; nothing existing changes behaviour, so there is no deployment ordering concern and rollback is reverting the change.
