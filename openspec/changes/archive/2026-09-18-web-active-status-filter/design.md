## Context

- `listBuildingsQuerySchema`, `buildingLocationsQuerySchema` and `listRoomsQuerySchema` each take `includeInactive` as `"true" | "false"`, transformed to a boolean, and each service writes `...(query.includeInactive ? {} : { isActive: true })`.
- The buildings and rooms screens render a switch labelled "Kể cả đang ngưng hoạt động", stored in the page address as `includeInactive=true`.
- Three other frontend callers pass `includeInactive: true` to get everything: the invoices and expenses room pickers, and the expense form.
- Service fees have their own `includeInactive`; nothing in this change reads it.

## Goals / Non-Goals

**Goals.** Ask the three-way question. One default the screens agree on. No second way of saying the same thing left behind.

**Non-Goals.** Service fees. A status filter anywhere else. Changing what retiring does.

## Decisions

### `status`, replacing `includeInactive` rather than joining it

`status: "active" | "inactive" | "all"`, defaulting to `active`. The service maps it once: `active → { isActive: true }`, `inactive → { isActive: false }`, `all → {}`.

`includeInactive` is removed rather than kept alongside. Two parameters that both answer "which statuses" is the shape where one is set, the other is not, and the answer depends on which the service reads first. We own every caller, so the three that wanted everything now say `status: "all"`.

The API default stays "in service only". Callers that never asked about retirement — the tenancy form's room picker among them — keep the behaviour they have. The screens' "everything" default is the SCREEN's default, expressed by sending `status=all`.

### The zod enum, not a boolean pair

`z.enum(["active", "inactive", "all"]).default("active")` refuses an unrecognised value with a 400 instead of quietly reading as a default, which is what `"tất cả"` typed into a URL would otherwise do.

### The screens send the choice explicitly

The control is a `Select` labelled "Trạng thái" with "Tất cả" first, then "Đang hoạt động" and "Đang ngưng hoạt động". Its value lives in the page address as `status`, like every other filter, so a filtered view can be shared or returned to.

Absent from the address means "Tất cả": the screens ask for `all` when the parameter is missing, so the default is one thing in one place rather than a value written into the URL on first render.

On the buildings screen the same status is passed to the locations endpoint, which is what it already did with the flag — a city offered as a choice must not produce an empty list.
