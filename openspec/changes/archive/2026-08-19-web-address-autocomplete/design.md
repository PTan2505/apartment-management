## Context

`BuildingFormDialog` collects the address as four text inputs. `api-address-lookup` provides `GET /addresses/search` and `GET /addresses/:placeId`, already normalised — the frontend never sees the provider, its field names, or the flag that decides whether administrative units are current.

The backend also decided that lookup being absent is a normal state: no key configured means the two endpoints answer `503 NOT_CONFIGURED` and everything else runs. This design has to hold that line from the client side.

See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- One field to fill an address, and no path where a building becomes uncreatable because of it.
- Show what will be saved, because the source is sometimes wrong.

**Non-Goals:**
- No repair of addresses already recorded. This stops new spellings appearing; the existing ones stay as they are.
- No provider knowledge on the client. If the provider changes, only the backend module moves.
- No map, coordinates, or place preview.

## Decisions

### Two modes, and which one the form starts in

```
  ┌──────────┐  choose a place   ┌──────────┐
  │  search  │──────────────────►│ resolved │  parts shown, read-only
  │          │                   │          │  placeId held
  └──────────┘◄──────────────────└─────┬────┘
       │       choose another place    │ correct a part
       │                               ▼
       │  "enter manually"       ┌──────────┐
       └────────────────────────►│  manual  │  parts editable
                                 │          │  placeId cleared
                                 └──────────┘
```

Creating starts in **search**, which is the point of the change. Editing starts in **manual**, because the building already has an address and the useful action is correcting it — opening an edit form in a state where the current values cannot be touched would be hostile.

An unconfigured or unreachable provider starts in **manual** too, with the reason stated. The form is never blocked by something the owner cannot fix.

### Correcting a part clears the recorded place

`placeId` is a claim about provenance: *these values came from that place*. Once a part is edited by hand the claim is no longer true, so it is dropped rather than left to mislead a future re-resolution.

The backend already anticipated this — its update requirement allows the identifier to be cleared for exactly this case, so the two halves agree without either being bent to fit.

### The parts are shown, not hidden

The alternative considered, and rejected, was the smallest possible form: a search field alone, with ward, city, and country never displayed. It reads better and it fails badly.

The API requires ward and city. Making a resolved place the only source of them means no building can be created when the provider is down, when no key is configured, when the address is absent from its data, or when what comes back is wrong — and it is sometimes wrong. While verifying the backend, a place whose own label read `tỉnh Đồng Nai` reported its region as `thành phố Đồng Nai`. Hiding that would have the owner save a province recorded as a city, with no sign anything had happened.

Showing the values costs four lines of read-only text and turns a silent wrong save into a visible one.

### Lookup failures are three different things

The backend distinguishes them, so the form can respond usefully rather than saying "something went wrong" three times:

```
  503 NOT_CONFIGURED       no key on this deployment   → manual entry, permanently
  502 UPSTREAM_UNAVAILABLE provider down or rejecting  → manual entry, retryable
  200 with no candidates   nothing matched the text    → "nothing found", keep typing
```

The third is not an error and must not look like one — the provider answers a search that matched nothing with a `404` internally, and the backend already converts that to an empty list precisely so the client is not misled.

### Debounced search, shared with `web-rooms`

Typing must not issue a request per keystroke, for the same reason as the rooms search — and here there is a second reason: the provider bills by session. The API accepts a session token grouping a run of searches with the resolution that follows, and the form generates one per address entry.

Unlike the rooms search this does not belong in the URL. A half-typed address is not a view worth sharing or restoring, and putting it in the address bar would push history entries during typing inside a dialog.

`web-rooms` introduces the same debounced input for its own search. Whichever change is built first adds it; the second uses it.

### The search is not a form field

The search box holds what the owner typed to find a place. It is not part of the building and is never submitted. Keeping it outside the form's values avoids a field that validates, participates in dirty checking, and would otherwise have to be excluded from every submission by hand.

## Risks / Trade-offs

- [The form is more stateful than the four plain inputs it replaces] → three states with explicit transitions, drawn above; the alternative is a simpler form that cannot create a building when an external service is unavailable.
- [An owner may accept a wrong resolved value without reading it] → the values are shown rather than hidden, which is the mitigation available; a form cannot prevent someone saving what they did not read.
- [`placeId` is cleared on any manual correction, including a trivial one] → deliberate. A partly-corrected address did not come from that place, and a stale identifier would make a future re-resolution silently wrong.
- [Two changes want the same debounced input and neither owns it yet] → whichever lands first adds it; the shape is small and identical in both.
- [Address lookup adds a failure mode to a form that had none] → contained by design: every failure path lands in manual entry, which is exactly the form that exists today.

## Migration Plan

Nothing is deployed. The form changes in place; buildings already recorded are unaffected and open in manual entry, since none has a recorded place. Rollback is reverting the change — the four inputs return and `placeId` simply stops being set.
