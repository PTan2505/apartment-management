## Context

`Building.address` is a single required free-text column holding whatever the owner typed. Building listing currently filters only on `includeInactive`. The room listing already established the project's search convention — partial, case-insensitive `contains` — when `api-room-lookup` added room-code search. See proposal.md for motivation.

Decisions locked before this design (from prior exploration, not reopened here): three levels of country, city, and ward with no district between them; country defaults to Vietnam; city and ward are required; filtering matches partially and ignores case.

## Goals / Non-Goals

**Goals:**
- Make "which buildings are in this ward" answerable, which the single free-text address cannot support.
- Keep the filter behaviour identical to the room-code search already in the API, so there is one convention rather than two.

**Non-Goals:**
- No reference data for cities and wards. See the decision below — this is the deliberate trade, not an oversight.
- No filtering of rooms, leases, invoices, or revenue by location. Every one of those reaches a building by id, so location filtering can be layered on later without touching them.
- No geocoding, coordinates, or postal codes.

## Decisions

**Three levels, no district**: country → city → ward. Vietnam's 2025 administrative reform removed the district tier, merging provinces and moving local government to two levels, so a ward now sits directly beneath a city or province. Modelling a district would encode an administrative level that no longer officially exists, and would leave a column that is either empty or holds stale pre-reform data. *(This is the reason for the omission; local practice on how addresses are written day to day is worth a sanity check from someone on the ground.)*

**`address` narrows from "the address" to "the street line"**: the column stays, but it now means house number and street only, with the administrative levels held separately. This is a semantic change to an existing field rather than a pure addition, which is why the create requirement is modified rather than extended — an owner who keeps writing the full address into it would duplicate the ward and city and make the filters disagree with what is displayed.

**City and ward are required; country defaults**: a building missing either is invisible to the filters this change exists to provide, so allowing them to be blank would quietly undermine the feature. Country defaults to Vietnam because it is the same for every building today, so requiring it would be friction with no benefit — but keeping the column means a future second country does not need a migration and a backfill.

Note that `country` is close to useless as a *filter* while every building shares one value. It is stored for completeness and future expansion, not because it narrows anything today.

**Free text rather than reference data**: `city` and `ward` are plain strings, matched with `contains` and `mode: "insensitive"`, exactly as room-code search works.

The cost is real and worth stating plainly: `Ho Chi Minh City`, `TP.HCM`, and `HCMC` are the same place and will not group together. With a handful of buildings entered by one person that is a non-issue — the owner sees the list and corrects it. It starts to bite once building count grows or a second person enters data.

Alternative considered: `City` and `Ward` lookup tables with foreign keys. That would make grouping reliable and give a UI a natural dropdown source, but it needs reference data seeded and maintained for a system managing a few buildings, and Vietnam's ward list was substantially rewritten by the same 2025 reform — so the reference data would itself need upkeep. Recorded here as the upgrade path if the free-text approach starts producing duplicates in practice.

**Partial matching over exact**: consistent with room-code search, and right for typed input, where a caller should not need to know whether the stored value reads `Ho Chi Minh City` or `Ho Chi Minh`. If a dropdown ever feeds these filters, exact matching would become the better fit and the change would be small.

## Risks / Trade-offs

- [Two spellings of one place do not group, so a city filter can silently return a partial list] → accepted at current scale and called out above; the lookup-table upgrade path is recorded rather than left to be rediscovered.
- [`address` changing meaning means existing rows may hold a full address, duplicating the new fields] → only one building exists and no production data does; the migration sets its values directly.
- [A `contains` match cannot use an index, so city and ward filters are sequential scans] → irrelevant across a handful of buildings, and the same trade already accepted for room-code search.
- [Making city and ward required breaks any caller creating a building without them] → intended, captured as a MODIFIED delta, and no frontend consumes the endpoint yet.
- [Storing `country` that never varies invites someone to remove it as dead weight] → the reasoning is recorded here so the decision is visible rather than looking like an oversight.

## Migration Plan

Adds `country` (defaulted), `city`, and `ward` to `Building`. `city` and `ward` are `NOT NULL` with no default, so the single existing row needs values — the migration sets them directly rather than backfilling, since there is one row and no production data. Deploy: `prisma migrate deploy`, then restart. Rollback: revert the migration together with the buildings module changes, since the service would otherwise select columns that no longer exist.
