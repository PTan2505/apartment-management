## Context

See proposal.md — Why. The measurements that drove this: 183 throw sites, 96
distinct messages, 5 codes.

Today a code comes from the error's CLASS — `ValidationError` hard-codes
`VALIDATION_ERROR` — so every caller of that class gets the same code by
construction. That is the mechanism to change, not just the values.

## Goals / Non-Goals

**Goals**

- A code per situation, and a Vietnamese phrase for every code.
- Making a missing phrase impossible to ship rather than something to remember.

**Non-Goals**

- Changing the envelope. Same four fields, same statuses; only `code` gets more
  specific.
- Translating the API. Its messages stay as they are — they are read in logs, by
  developers, and the change is that nobody puts them in front of an owner.
- Supporting more than one language. There is one, and building for a second one
  that does not exist would be building the wrong abstraction from a guess.

## Decisions

### The code is a constructor argument, not a property of the class

`ValidationError` stops declaring `code = "VALIDATION_ERROR"` and starts taking
the code from its caller: `new ValidationError("ROOM_BUILDING_RETIRED", "...")`.

The class keeps deciding the STATUS, which is the thing that really is a
property of the kind of error. What varies per throw site is which situation it
is, and that is exactly what the caller knows and the class does not.

The alternative — one subclass per situation, 96 classes — was rejected. A class
buys behaviour; these would differ only in a string.

### `code` becomes the specific one; the category moves to `status`

The alternative is keeping `code` as the category and adding a second field for
the situation. Rejected: two codes invite the question "which one do I use", and
the answer would have to be re-derived by every reader.

Nothing is lost. The four categories the existing web requirement asks screens
to distinguish — validation, authorization, missing, conflict — are 400, 401/403,
404 and 409. The one distinction status cannot carry is malformed-body versus
validation failure, both 400, and the spec requires those be told apart by code:
they will have different specific codes, so it holds.

### The frontend's code union is generated, and the dictionary is exhaustive

A hand-copied union drifts. A generated one cannot.

A script in the backend collects every code in the source and writes a union
type into the frontend. The dictionary is then typed `Record<ApiErrorCode,
string>`, so a code with no phrase is a type error, not a runtime surprise. This
is the same device that already keeps `roleLabel` honest — and it exists because
the role label was printed raw for months before anyone noticed.

CI runs the generator and fails if the checked-in file differs, so the two sides
cannot drift through someone forgetting to run it.

### An unknown code falls back by status, never to English

Exhaustiveness cannot cover a backend deployed ahead of its frontend. There, the
frontend meets a code it has never heard of.

It falls back to a Vietnamese sentence chosen by HTTP status — "không tìm thấy",
"không thể thực hiện", "cần đăng nhập lại" — which is vague but true and in the
right language. The two alternatives are worse: the API's own message puts
English in front of the reader exactly when something unfamiliar broke, and the
code itself puts a developer's identifier there.

### Naming: `DOMAIN_SITUATION`, and never renamed

Screaming snake case, prefixed by the domain that raises it, describing the
SITUATION rather than the fix: `LEASE_ROOM_RETIRED`, not `PICK_ANOTHER_ROOM`.

Codes are frozen once shipped. Improving a code's wording renames an identifier
other systems store and branch on; the wording that should improve is the
Vietnamese phrase, which is exactly what this change moves to where it can be
changed freely.

## Risks / Trade-offs

**96 codes and 96 sentences is a large mechanical change with room for
copy-paste error** → Done module by module rather than in one pass, with the
tasks ordered so each module compiles and its endpoints answer before the next
is started.

**A specific code makes it easier to write a caller that branches on a narrow
condition and breaks when the condition is renamed** → Mitigated by codes being
frozen. Stated in the spec rather than left as a convention.

**The frontend gains a 96-entry file nobody wants to read** → It is a dictionary;
it is meant to be looked up, not read. Ordered by domain so a reader can find
the section they are working in.

## Open Questions

None that block. Whether the tenant portal should phrase any code differently
from the owner's application is answerable later: the spec permits it, both
surfaces share one dictionary until a difference is actually wanted, and adding
a second phrase for one code changes no requirement and no task below.
