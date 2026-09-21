## Context

- `lib/storage.ts` signs uploads and downloads, derives keys, clears a prefix except one object, and treats "unconfigured" as a state callers ask about.
- Two features already follow the three-step upload: a tenancy's signed contract and a customer's ID card.
- The database holds a key for each of those. The ID card work produced an object in the bucket that no row points at — proof that a record and a bucket can drift apart.
- No settings table exists, and no model fits a system-wide document.

## Goals / Non-Goals

**Goals.** One blank contract, reachable from the screen where tenancies are signed. No new table, no migration.

**Non-Goals.** Several named templates. A template per building. Versions or history. Filling the template in. A public URL.

## Decisions

### Storage is the only record

The template lives at `templates/contract/` and nothing about it is written to the database.

A table would hold one row with one meaningful column, and would add a second place for the same fact — the failure mode already seen once. Everything a screen needs is in the object itself: its key carries the file name, `LastModified` is when it was uploaded, `ContentLength` is its size.

The cost is one storage call to answer "is there a template", where a column would have been free. That is one small request on a screen nobody opens in a loop.

**When a table becomes right:** several named templates, or one per building. Per building is a column on `Building`, not a table. Neither is this change.

### The file name lives in the key

`templates/contract/{uuid}__{original name}`. The random part still prevents a cached copy being served after a replacement; the suffix is what makes the download land as `hop-dong-mau.pdf` rather than `9f3a…c7.pdf`.

The name is sanitised before it goes into a key — path separators removed, length capped — because it arrives from a caller and a key is a path.

Download is signed with a content-disposition naming that same file, so the browser saves it under the name the owner uploaded.

### Saving the file without leaving the screen

The screen fetches the signed link's bytes and hands them to the browser as a
blob to save. The obvious alternative — sending the browser to the signed link
— either opens a tab or navigates the tenancies screen away, and a pop-up
blocker can swallow that tab silently, since the open happens after an `await`
and no longer counts as a click. Fetching also keeps a refusal on the screen:
following the link turns a storage error into a page of XML, while this shows a
sentence above the list. It costs holding the file in memory, capped at 20 MB by
the same limit that governs the upload.

The `download` attribute names the saved file, which is honoured because a blob
URL is same-origin. The signed link's own content-disposition stays as it is —
it is what makes the name right for anyone who does follow the link directly.

### What a blank contract can be

PDF, Word (.doc, .docx) and images. A blank contract is something to print: a PDF or a Word document in practice, and a photograph of a paper form is not unreasonable. 20 MB, matching the signed contract.

### The screen shows it where contracts are signed

A strip above the tenancies list: the file name and when it was uploaded, with download, replace and remove. Above rather than beside, so the list keeps the width it needs; quiet rather than prominent, because it is consulted occasionally and the screen is about tenancies.

## Risks / Trade-offs

**No permanent URL.** The bucket is private, so every download is a freshly signed link that expires in minutes. The owner cannot bookmark it or paste it into a message — which is the same trade already accepted for signed contracts, and for a blank form it costs nothing but a click.

**Two owners would share one template.** There is one owner account in v1. If that changes, this becomes a question about whose template it is, and the answer will probably be per building.
