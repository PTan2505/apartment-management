## Context

Recording that somebody moved out of a shared room touches two endpoints today: `POST /leases/:id/occupants/:occupantId/departure` and `POST /leases/:id/primary`. The service refuses to depart the person responsible while others remain, and the screen answers that refusal by transferring first and then departing — two requests, issued from a dialog that already knows who the candidates are.

Departing the **only** occupant is accepted by both. The result is a tenancy that is running, billed monthly, holding a deposit, and occupying a room, whose occupant list is empty.

## Goals / Non-Goals

**Goals.** A running tenancy always has somebody living in it. A handover that accompanies a departure is one write.

**Non-Goals.** Not changing what a move-out does, not changing how the deposit settles, not adding a way to end a tenancy — that action exists and is what this points at.

## Decisions

### The refusal names the operation the owner actually wanted

`LAST_OCCUPANT_CANNOT_DEPART` is a refusal an owner meets while trying to do something reasonable, so its message says what does apply: ending the tenancy, with its own action on the same screen. A refusal that only states a rule leaves the owner to guess which of the remaining actions was meant.

The screen does not rely on that message. It withholds the action for a single occupant, because an action that is always refused is worse than no action.

### The successor rides along with the departure

`successorId`, optional, on the departure request. Supplied, it must name a current occupant other than the one leaving; the two writes happen in one transaction.

The alternative — keeping two endpoints and asking the frontend to call them in order — is what exists now, and it can half-succeed: the transfer lands, the departure fails, and the agreement names somebody who never took it while the previous holder is still living there. Nothing in the system reports that as wrong, because each request individually did what it said.

Transferring on its own stays exactly as it is. An owner handing over responsibility without anybody leaving is a real operation, and folding it into departure would remove it.

### Why not let the tenancy close itself when the last person leaves

Tempting, and wrong. A move-out takes a closing meter reading, bills a final month and settles a deposit — none of which the departure dialog asks for, and none of which can be invented. Closing a tenancy silently on the way out of an occupant record would produce a final bill nobody reviewed.

## Risks / Trade-offs

**An owner whose habit is "depart the last person, then move out" meets a refusal.** That sequence records the same tenancy ending twice, and only one of the two settles anything. The refusal costs them a click and the tenancy gets the closing it needs.

**`successorId` makes the departure endpoint do two things.** Accepted deliberately: they are two halves of one event, and the alternative is the half-success this change exists to remove.
