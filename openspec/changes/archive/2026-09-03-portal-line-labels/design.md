## Context

See proposal.md — Why. What already exists:

- `lineLabel` in `features/invoices/labels.ts` names every charge kind, rebuilding generated text from the row's own fields and leaving owner-written text alone. It handles the four deposit phrases and the one system-written `charge`.
- The portal builds its own `CHARGE_LABEL` map from `kind` to a Vietnamese word, and renders the stored description as a caption beneath it.
- The portal is a separate Vite entry over the same `src` tree, so an import resolves — but importing an owner FEATURE from the tenant portal would tie two surfaces together through a folder that belongs to one of them.

## Goals / Non-Goals

**Goals:**

- The portal's charges read in Vietnamese.
- One implementation, so the two surfaces cannot disagree.

**Non-Goals:**

- Any backend or data change.
- Changing what the portal shows besides the charge name.

## Decisions

**The labelling moves to `lib/`, rather than the portal importing from `features/invoices/`.**

The portal is not an owner feature and should not reach into one. Moving it to `lib/` — where `format` and the API client already live — puts it where both surfaces can take it from without either owning it.

The alternative, duplicating it, is what this change exists to prevent: a tenant querying a bill against the owner's screen is exactly when two descriptions of the same charge would surface, and it would surface as an argument about whether the bill is right.

**The label becomes the charge's heading; the kind map goes.**

`Tiền nhà tháng 8/2026` carries the kind and the month in one line, where the portal previously used two — a Vietnamese heading and an English caption. The heading now says more and the caption keeps only the basis and the period, which are numbers.

For an owner-written charge this is a real improvement rather than a translation: today a broken window reads as *Khoản phát sinh* with the owner's sentence demoted underneath, and the sentence is the part a tenant needs.

## Risks / Trade-offs

**A tenant sees a charge named differently from the receipt they were given** → Only for bills issued before this; the name changes, the figures do not, and the description is still what the record holds.

**`lib/` accumulates domain knowledge** → It already holds money formatting, which is the same kind of thing: presentation shared by both surfaces. Anything about who may do what stays out.

## Migration Plan

None. Presentation only.
