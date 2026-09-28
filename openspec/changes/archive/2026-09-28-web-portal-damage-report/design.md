## Context

The portal is one screen: the tenant's name, the room, a list of bills, and a
way to pay one. It holds a token in session storage and fetches everything
through it.

## Goals / Non-Goals

- Goal: reporting a fault is as easy as looking at a bill.
- Non-Goal: a conversation. There is no reply, no thread, no notification — the
  tenant sees the state and the appointment, and rings if they need more.
- Non-Goal: categories. Asking a tenant to classify their leak is asking them to
  do the triage; the words they use are the record.

## Decisions

### Reports sit beside the bills, on the same screen

Not a second screen behind a link. The portal is one page a tenant scrolls,
usually on a phone, and one page with two sections is easier to hold than two
pages with one each.

### The state is said in the tenant's terms

"Đã nhận, chưa hẹn lịch" rather than "new". The states are the staff's
vocabulary; what the tenant needs is whether somebody is coming and when.

### Photographs upload the way contracts do

The three-step presigned path already in this application. Same constraints,
same Vietnamese failure messages, no second implementation.

## Risks / Trade-offs

- **A tenant who reports nothing is still unheard.** The portal cannot fix
  that; it can only be the easiest of the options they have.
- **No notification to staff.** Stated in the API change: staff find new reports
  by opening the screen.
